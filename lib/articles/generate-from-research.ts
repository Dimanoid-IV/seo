import "server-only";

import {
  ActivityType,
  AIJobStatus,
  AIJobType,
  AIUsagePurpose,
  ArticleStatus,
  WebsiteLanguage,
  WebsiteStatus,
} from "@prisma/client";

import { assertUsageLimit, recordUsage } from "@/lib/billing/feature-gates";
import { parseContentResearchBrief } from "@/lib/content-research/parse";
import type { ContentResearchBrief } from "@/lib/content-research/types";
import {
  analyzeResearchBriefReadiness,
} from "@/lib/content-research/readiness";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { generateArticleDraft } from "@/lib/hermes/client";
import {
  MAX_QUALITY_REPAIR_ATTEMPTS,
  repairGeneratedArticle,
} from "@/lib/hermes/article-quality";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";

import {
  buildResearchTaskContext,
  resolveTargetKeywordFromBrief,
  resolveTopicFromBrief,
} from "./build-research-context";
import { humanizeArticleDraft } from "./humanize-article";
import {
  isWordPressConnectedForWebsite,
  serializeArticleRecord,
} from "./article-serialize";
import {
  qualityReportToIssuesSnapshot,
  validateResearchAwareArticle,
} from "./research-quality-gates";
import {
  buildEvidenceNotes,
  type ArticleGenerationMetadata,
} from "./research-generation-types";
import type { SerializedArticle } from "./types";

export type GenerateArticleFromResearchInput = {
  websiteId: string;
  organizationId: string;
  userId: string;
  researchBrief: ContentResearchBrief;
  monthlyAutopilotPlanId?: string | null;
  planItemId?: string | null;
  language?: WebsiteLanguage | null;
};

export type GenerateArticleFromResearchResult = {
  article: SerializedArticle;
  qualityReport: ArticleGenerationMetadata["qualityReport"];
  planItemId?: string;
};

async function resolveWebsiteForResearchGeneration(
  userId: string,
  organizationId: string,
  websiteId: string
) {
  const prisma = getPrisma();

  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      ownerUserId: userId,
      deletedAt: null,
    },
  });

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
  }

  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      organizationId: organization.id,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    select: {
      id: true,
      url: true,
      niche: true,
      primaryLanguage: true,
      organizationId: true,
    },
  });

  if (!website) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Add a website to generate articles"
    );
  }

  return { organization, website };
}

function assertResearchBriefReady(brief: ContentResearchBrief): void {
  const readiness = analyzeResearchBriefReadiness(brief);
  if (readiness.ready) {
    return;
  }

  const messageByReason: Partial<Record<string, string>> = {
    unsafePrimaryKeyword:
      "This looks like a site issue, not an article topic. Regenerate topic/research or choose a business keyword.",
    unsafeRecommendedTitle:
      "This looks like a site issue, not an article topic. Regenerate topic/research or choose a business keyword.",
    notReadyForGeneration:
      "Research brief is blocked or incomplete. Refresh research first.",
    missingPrimaryKeyword:
      "Research brief is blocked or incomplete. Refresh research first.",
    missingBuyerQuestion:
      "Research brief is missing buyer question or GEO prompts.",
    missingGeoPrompts:
      "Research brief is missing buyer question or GEO prompts.",
  };

  throw new AppError(
    ErrorCode.VALIDATION_ERROR,
    (readiness.reasonKey && messageByReason[readiness.reasonKey]) ||
      brief.blockedReason ||
      "Research brief is blocked or incomplete. Refresh research first."
  );
}

/**
 * Generates a humanized article draft from a ContentResearchBrief.
 * Does not publish externally — draft goes to Review Queue when quality passes.
 */
export async function generateArticleFromResearchBrief(
  input: GenerateArticleFromResearchInput
): Promise<GenerateArticleFromResearchResult> {
  const brief = input.researchBrief;

  if (brief.websiteId !== input.websiteId) {
    throw new AppError(ErrorCode.FORBIDDEN, "Research brief website mismatch.");
  }

  if (brief.organizationId !== input.organizationId) {
    throw new AppError(ErrorCode.FORBIDDEN, "Research brief organization mismatch.");
  }

  assertResearchBriefReady(brief);

  const prisma = getPrisma();
  const { organization, website } = await resolveWebsiteForResearchGeneration(
    input.userId,
    input.organizationId,
    input.websiteId
  );

  await assertUsageLimit({
    userId: input.userId,
    organizationId: organization.id,
    websiteId: website.id,
    key: "AI_GENERATION",
    message:
      "You've reached the monthly AI generation limit for your current plan. Upgrade to continue generating content.",
  });

  await assertUsageLimit({
    userId: input.userId,
    organizationId: organization.id,
    websiteId: website.id,
    key: "ARTICLE_DRAFT",
    message:
      "You've reached the monthly article limit for your current plan. Upgrade to continue.",
  });

  const topic = resolveTopicFromBrief(brief);
  const targetKeyword = resolveTargetKeywordFromBrief(brief);
  const language =
    input.language ?? website.primaryLanguage ?? WebsiteLanguage.RU;
  const researchContext = buildResearchTaskContext(brief);
  const evidenceNotes = buildEvidenceNotes(brief);

  const now = new Date();
  const aiJob = await prisma.aIJob.create({
    data: {
      websiteId: website.id,
      organizationId: organization.id,
      userId: input.userId,
      type: AIJobType.GENERATE_ARTICLE,
      status: AIJobStatus.QUEUED,
      inputJson: {
        source: "research_brief",
        researchBriefId: brief.id,
        planItemId: input.planItemId ?? null,
        monthlyAutopilotPlanId: input.monthlyAutopilotPlanId ?? null,
        topic,
        targetKeyword,
        language,
      },
      startedAt: now,
    },
  });

  await prisma.aIJob.update({
    where: { id: aiJob.id },
    data: { status: AIJobStatus.RUNNING },
  });

  try {
    const hermesResult = await generateArticleDraft({
      website: {
        url: website.url,
        niche: website.niche,
        language: language.toLowerCase(),
      },
      task: {
        title: topic,
        description: brief.contentGapSummary || brief.buyerQuestion,
        recommendationJson: researchContext,
      },
      article: {
        topic,
        targetKeyword,
        language: language.toLowerCase(),
      },
      constraints: {
        noFakeClaims: true,
        noGuaranteedRankings: true,
        writeForSmallBusinessOwner: true,
        includeFaq: true,
        includeMeta: true,
      },
    });

    const humanized = await humanizeArticleDraft(hermesResult, {
      brief,
      website: {
        url: website.url,
        niche: website.niche,
        language: language.toLowerCase(),
      },
      topic,
      targetKeyword,
    });

    let currentArticle = humanized.article;
    let repairAttempts = 0;
    let qualityReport = validateResearchAwareArticle(currentArticle, {
      targetKeyword,
      brief,
      evidenceNotesCount: evidenceNotes.length,
    });

    const repairUsages: Array<{
      costCents: number;
      provider: string;
      model: string;
      inputTokens?: number | null;
      outputTokens?: number | null;
      totalTokens?: number | null;
    }> = [];

    while (
      repairAttempts < MAX_QUALITY_REPAIR_ATTEMPTS &&
      !qualityReport.passed
    ) {
      const openIssues = qualityReport.checks
        .filter((c) => !c.passed && c.severity === "error")
        .map((c) => ({
          code: c.key,
          message: c.message,
          severity: "error" as const,
        }));

      if (openIssues.length === 0) {
        break;
      }

      const repaired = await repairGeneratedArticle(
        currentArticle,
        openIssues,
        {
          website: {
            url: website.url,
            niche: website.niche,
            language: language.toLowerCase(),
          },
          targetKeyword,
          topic,
        }
      );

      repairAttempts += 1;
      currentArticle = repaired;

      if (repaired.metadata) {
        repairUsages.push({
          costCents: repaired.metadata.costCents ?? 0,
          provider: repaired.metadata.provider ?? "hermes",
          model: repaired.metadata.model ?? "unknown",
          inputTokens: repaired.metadata.inputTokens ?? null,
          outputTokens: repaired.metadata.outputTokens ?? null,
          totalTokens: repaired.metadata.totalTokens ?? null,
        });
      }

      const rehumanized = await humanizeArticleDraft(currentArticle, {
        brief,
        website: {
          url: website.url,
          niche: website.niche,
          language: language.toLowerCase(),
        },
        topic,
        targetKeyword,
      });

      currentArticle = rehumanized.article;
      qualityReport = validateResearchAwareArticle(currentArticle, {
        targetKeyword,
        brief,
        evidenceNotesCount: evidenceNotes.length,
      });
    }

    const qualityIssuesJson = qualityReportToIssuesSnapshot(
      qualityReport,
      repairAttempts
    );

    const articleStatus = qualityReport.passed
      ? ArticleStatus.WAITING_REVIEW
      : ArticleStatus.DRAFT;

    const generationMetadata: ArticleGenerationMetadata = {
      source: input.planItemId ? "AUTOPILOT_PLAN" : "MANUAL_RESEARCH",
      researchBriefId: brief.id,
      researchBriefSummary: {
        primaryKeyword: brief.primaryKeyword,
        buyerQuestion: brief.buyerQuestion,
        geoPromptCount: brief.geoPrompts.length,
      },
      monthlyAutopilotPlanId: input.monthlyAutopilotPlanId ?? undefined,
      planItemId: input.planItemId ?? undefined,
      geoPromptsUsed: brief.geoPrompts.map((g) => g.prompt),
      evidenceNotes,
      qualityReport,
      humanizedAt: humanized.humanizedAt,
      humanizerMethod: humanized.method,
      generatedAt: new Date().toISOString(),
    };

    const generateMetadata = hermesResult.metadata;
    const generateCostCents = generateMetadata?.costCents ?? 0;
    const repairCostCents = repairUsages.reduce(
      (sum, usage) => sum + usage.costCents,
      0
    );
    const totalCostCents = generateCostCents + repairCostCents;

    const article = await prisma.$transaction(async (tx) => {
      const createdArticle = await tx.article.create({
        data: {
          websiteId: website.id,
          organizationId: organization.id,
          title: currentArticle.title,
          slug: currentArticle.slug,
          language,
          status: articleStatus,
          topic,
          targetKeyword,
          metaTitle: currentArticle.metaTitle,
          metaDescription: currentArticle.metaDescription,
          contentHtml: currentArticle.contentHtml,
          faqJson:
            currentArticle.faqJson === null ||
            currentArticle.faqJson === undefined
              ? undefined
              : (currentArticle.faqJson as object),
          schemaJson:
            currentArticle.schemaJson === null ||
            currentArticle.schemaJson === undefined
              ? undefined
              : (currentArticle.schemaJson as object),
          contentJson: generationMetadata as object,
          generatedByAIJobId: aiJob.id,
          qualityScore: qualityReport.score,
          qualityPassed: qualityReport.passed,
          qualityIssuesJson: qualityIssuesJson as object,
          qualityRepairAttempts: repairAttempts,
        },
        select: {
          id: true,
          websiteId: true,
          organizationId: true,
          title: true,
          slug: true,
          language: true,
          status: true,
          topic: true,
          targetKeyword: true,
          metaTitle: true,
          metaDescription: true,
          contentHtml: true,
          faqJson: true,
          schemaJson: true,
          wordpressPostId: true,
          wordpressEditUrl: true,
          generatedByAIJobId: true,
          qualityScore: true,
          qualityPassed: true,
          qualityIssuesJson: true,
          qualityRepairAttempts: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.aIJob.update({
        where: { id: aiJob.id },
        data: {
          status: AIJobStatus.COMPLETED,
          provider: generateMetadata?.provider ?? "hermes",
          model: generateMetadata?.model ?? null,
          outputJson: JSON.parse(JSON.stringify(currentArticle)) as object,
          costCents: totalCostCents,
          completedAt: new Date(),
        },
      });

      await tx.aIUsage.create({
        data: {
          aiJobId: aiJob.id,
          websiteId: website.id,
          organizationId: organization.id,
          userId: input.userId,
          provider: generateMetadata?.provider ?? "hermes",
          model: generateMetadata?.model ?? "unknown",
          inputTokens: generateMetadata?.inputTokens ?? null,
          outputTokens: generateMetadata?.outputTokens ?? null,
          totalTokens: generateMetadata?.totalTokens ?? null,
          costCents: generateCostCents,
          purpose: AIUsagePurpose.CONTENT_GENERATION,
        },
      });

      for (const repairUsage of repairUsages) {
        await tx.aIUsage.create({
          data: {
            aiJobId: aiJob.id,
            websiteId: website.id,
            organizationId: organization.id,
            userId: input.userId,
            provider: repairUsage.provider,
            model: repairUsage.model,
            inputTokens: repairUsage.inputTokens ?? null,
            outputTokens: repairUsage.outputTokens ?? null,
            totalTokens: repairUsage.totalTokens ?? null,
            costCents: repairUsage.costCents,
            purpose: AIUsagePurpose.QUALITY_REPAIR,
          },
        });
      }

      await tx.activity.create({
        data: {
          organizationId: organization.id,
          websiteId: website.id,
          userId: input.userId,
          type: ActivityType.ARTICLE_CREATED,
          title: "Article created from research",
          description: createdArticle.title,
          metadataJson: {
            articleId: createdArticle.id,
            aiJobId: aiJob.id,
            source: "research_brief",
            researchBriefId: brief.id,
            planItemId: input.planItemId ?? null,
          },
        },
      });

      await tx.activity.create({
        data: {
          organizationId: organization.id,
          websiteId: website.id,
          userId: input.userId,
          type: ActivityType.ARTICLE_VALIDATED,
          title: "Article quality checked",
          description: createdArticle.title,
          metadataJson: {
            articleId: createdArticle.id,
            qualityScore: qualityReport.score,
            qualityPassed: qualityReport.passed,
          },
        },
      });

      if (repairAttempts > 0) {
        await tx.activity.create({
          data: {
            organizationId: organization.id,
            websiteId: website.id,
            userId: input.userId,
            type: ActivityType.ARTICLE_REPAIRED,
            title: "Article improved",
            description: createdArticle.title,
            metadataJson: {
              articleId: createdArticle.id,
              repairAttempts,
              qualityScore: qualityReport.score,
            },
          },
        });
      }

      return createdArticle;
    });

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
      key: "ARTICLE_DRAFT",
    });

    const wordpressConnected = await isWordPressConnectedForWebsite(
      website.id
    );

    try {
      await syncGrowthOpportunitiesForWebsite({
        websiteId: website.id,
        organizationId: organization.id,
        userId: input.userId,
      });
    } catch {
      // Growth sync must not block article generation.
    }

    try {
      const { timelineAfterArticleDraftCreated, timelineAfterQualityCheck } =
        await import("@/lib/timeline/hooks");

      await timelineAfterArticleDraftCreated({
        userId: input.userId,
        websiteId: website.id,
        articleId: article.id,
        title: article.title,
      });

      const issuesCount = qualityReport.checks.filter((c) => !c.passed).length;

      await timelineAfterQualityCheck({
        userId: input.userId,
        websiteId: website.id,
        articleId: article.id,
        title: article.title,
        qualityScore: qualityReport.score,
        qualityPassed: qualityReport.passed,
        issuesCount,
      });
    } catch {
      // Timeline sync must not block article generation.
    }

    return {
      article: serializeArticleRecord(article, wordpressConnected),
      qualityReport,
      planItemId: input.planItemId ?? undefined,
    };
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
            : "Could not generate article draft from research",
      },
    });

    throw error;
  }
}

/** Parse and validate a research brief from raw JSON. */
export function parseResearchBriefOrThrow(
  value: unknown
): ContentResearchBrief {
  const brief = parseContentResearchBrief(value);
  if (!brief) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Research brief is missing or invalid."
    );
  }
  return brief;
}
