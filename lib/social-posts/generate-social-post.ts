import {
  AIJobStatus,
  AIJobType,
  AIUsagePurpose,
  SocialPostStatus,
  WebsiteLanguage,
} from "@prisma/client";

import { assertUsageLimit, recordUsage } from "@/lib/billing/feature-gates";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { generateSocialPostDraft } from "@/lib/hermes/client";

import {
  createSocialPost,
  resolveWebsiteForSocialPosts,
} from "./create-social-post";
import { mapApiPlatformToSocialPlatform, validateSocialPostQuality } from "./quality";
import { loadSocialPostSourceContext } from "./source-context";
import type { GenerateSocialPostInput, SocialPostViewModel } from "./types";

export async function generateSocialPostDraftForWebsite(
  input: GenerateSocialPostInput
): Promise<SocialPostViewModel> {
  const prisma = getPrisma();
  const { organization, website } = await resolveWebsiteForSocialPosts(
    input.userId,
    input.organizationId ?? null,
    input.websiteId
  );

  await assertUsageLimit({
    userId: input.userId,
    organizationId: organization.id,
    websiteId: website.id,
    key: "AI_GENERATION",
    message:
      "You've reached the monthly AI generation limit for your current plan. Upgrade to continue.",
  });

  await assertUsageLimit({
    userId: input.userId,
    organizationId: organization.id,
    websiteId: website.id,
    key: "SOCIAL_POST",
    message:
      "You've reached the monthly social post limit for your current plan. Upgrade to continue.",
  });
  const platform = mapApiPlatformToSocialPlatform(input.platform);
  const language =
    input.language ?? website.primaryLanguage ?? WebsiteLanguage.EN;

  const sourceContext = await loadSocialPostSourceContext({
    websiteId: website.id,
    userId: input.userId,
    source: input.source,
    sourceId: input.sourceId,
  });

  const aiJob = await prisma.aIJob.create({
    data: {
      websiteId: website.id,
      organizationId: organization.id,
      userId: input.userId,
      type: AIJobType.GENERATE_SOCIAL_POSTS,
      status: AIJobStatus.RUNNING,
      inputJson: {
        platform,
        source: input.source,
        sourceId: sourceContext.sourceId,
      },
      startedAt: new Date(),
    },
  });

  try {
    const hermesResult = await generateSocialPostDraft({
      website: {
        url: website.url,
        niche: website.niche,
        language: language.toLowerCase(),
      },
      platform,
      source: {
        type: input.source,
        context: sourceContext.context,
      },
      constraints: {
        noFakeClaims: true,
        noAutoPublishLanguage: true,
        platformSpecificTone: true,
      },
    });

    const quality = validateSocialPostQuality({
      title: hermesResult.title,
      text: hermesResult.text,
      platform,
      language,
      cta: hermesResult.cta,
      hashtags: hermesResult.hashtags,
    });

    const post = await createSocialPost({
      userId: input.userId,
      websiteId: website.id,
      organizationId: organization.id,
      title: hermesResult.title,
      content: hermesResult.text,
      platform,
      language,
      source: sourceContext.source,
      sourceId: sourceContext.sourceId,
      hook: hermesResult.hook,
      hashtags: hermesResult.hashtags,
      cta: hermesResult.cta,
      qualityScore: quality.qualityScore,
      qualityIssues: quality.issues,
      status: quality.passed ? SocialPostStatus.READY : SocialPostStatus.DRAFT,
      generatedByAIJobId: aiJob.id,
      articleId: sourceContext.articleId ?? null,
    });

    const costCents = hermesResult.metadata?.costCents ?? 0;

    await prisma.$transaction([
      prisma.aIJob.update({
        where: { id: aiJob.id },
        data: {
          status: AIJobStatus.COMPLETED,
          provider: hermesResult.metadata?.provider ?? "hermes",
          model: hermesResult.metadata?.model ?? null,
          outputJson: hermesResult as object,
          costCents,
          completedAt: new Date(),
        },
      }),
      prisma.aIUsage.create({
        data: {
          aiJobId: aiJob.id,
          websiteId: website.id,
          organizationId: organization.id,
          userId: input.userId,
          provider: hermesResult.metadata?.provider ?? "hermes",
          model: hermesResult.metadata?.model ?? "unknown",
          inputTokens: hermesResult.metadata?.inputTokens ?? null,
          outputTokens: hermesResult.metadata?.outputTokens ?? null,
          totalTokens: hermesResult.metadata?.totalTokens ?? null,
          costCents,
          purpose: AIUsagePurpose.SOCIAL_GENERATION,
        },
      }),
    ]);

    await recordUsage({
      userId: input.userId,
      organizationId: organization.id,
      websiteId: website.id,
      key: "AI_GENERATION",
    });

    await recordUsage({
      userId: input.userId,
      organizationId: organization.id,
      websiteId: website.id,
      key: "SOCIAL_POST",
    });

    return post;
  } catch (error) {
    await prisma.aIJob.update({
      where: { id: aiJob.id },
      data: {
        status: AIJobStatus.FAILED,
        failedAt: new Date(),
        errorCode:
          error instanceof AppError ? error.code : ErrorCode.INTERNAL_ERROR,
        errorMessage:
          error instanceof AppError
            ? error.message
            : "Failed to generate social post",
      },
    });
    throw error;
  }
}
