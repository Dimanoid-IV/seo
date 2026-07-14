import {
  ActivityType,
  AIJobStatus,
  AIJobType,
  AIUsagePurpose,
  ArticleStatus,
  WebsiteLanguage,
  WebsiteStatus,
} from "@prisma/client";

import { findPrimaryOrganization } from "@/lib/auth/queries";
import { assertUsageLimit, recordUsage } from "@/lib/billing/feature-gates";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { generateArticleDraft } from "@/lib/hermes/client";
import { runArticleQualityPipeline } from "@/lib/hermes/article-quality";
import { isUnsafeArticleTopic } from "@/lib/content-research/keywords";

import {
  isWordPressConnectedForWebsite,
  serializeArticleRecord,
} from "./article-serialize";
import type { SerializedArticle } from "./types";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";

type GenerateArticleInput = {
  websiteId?: string | null;
  userId: string;
  organizationId?: string | null;
  taskId?: string | null;
  topic?: string | null;
  targetKeyword?: string | null;
  language?: WebsiteLanguage | null;
};

async function resolveWebsiteForGeneration(
  userId: string,
  organizationId: string | null,
  websiteId?: string | null
) {
  const prisma = getPrisma();

  let organization = organizationId
    ? await prisma.organization.findFirst({
        where: {
          id: organizationId,
          ownerUserId: userId,
          deletedAt: null,
        },
      })
    : null;

  if (!organization) {
    organization = await findPrimaryOrganization(prisma, userId);
  }

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Организация не найдена");
  }

  const website = websiteId
    ? await prisma.website.findFirst({
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
      })
    : await prisma.website.findFirst({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
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
      "Добавьте сайт, чтобы генерировать статьи"
    );
  }

  return { organization, website };
}

/**
 * Generates a DRAFT article via Hermes for the user's website.
 */
export async function generateArticleDraftForWebsite(
  input: GenerateArticleInput
): Promise<SerializedArticle> {
  const prisma = getPrisma();
  const { organization, website } = await resolveWebsiteForGeneration(
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

  let task: {
    id: string;
    title: string;
    description: string | null;
    recommendationJson: unknown;
    websiteId: string;
  } | null = null;

  if (input.taskId) {
    task = await prisma.task.findFirst({
      where: {
        id: input.taskId,
        deletedAt: null,
        websiteId: website.id,
        organization: {
          ownerUserId: input.userId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        recommendationJson: true,
        websiteId: true,
      },
    });

    if (!task) {
      throw new AppError(ErrorCode.NOT_FOUND, "Задача не найдена");
    }
  }

  const explicitTopic = input.topic?.trim() || null;
  const explicitKeyword = input.targetKeyword?.trim() || null;

  if (task) {
    const taskTitleUnsafe = isUnsafeArticleTopic(task.title);
    const topicUnsafe = explicitTopic ? isUnsafeArticleTopic(explicitTopic) : false;

    if (taskTitleUnsafe && !explicitKeyword && (!explicitTopic || topicUnsafe)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Эта задача описывает проблему страницы, а не тему статьи. Используйте «Подготовить исправление» или укажите бизнес-ключевое слово."
      );
    }
  }

  const topic =
    explicitTopic ||
    (task?.title?.trim() && !isUnsafeArticleTopic(task.title)
      ? task.title.trim()
      : null);

  if (!topic && !explicitKeyword) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Укажите topic, ключевое слово или выберите задачу с безопасной темой."
    );
  }

  const targetKeyword = explicitKeyword;
  const resolvedTopic = topic ?? explicitKeyword!;
  const language =
    input.language ?? website.primaryLanguage ?? WebsiteLanguage.RU;

  const now = new Date();
  const aiJob = await prisma.aIJob.create({
    data: {
      websiteId: website.id,
      organizationId: organization.id,
      userId: input.userId,
      type: AIJobType.GENERATE_ARTICLE,
      status: AIJobStatus.QUEUED,
      inputJson: {
        taskId: task?.id ?? null,
        topic: resolvedTopic,
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
      task: task
        ? {
            title: task.title,
            description: task.description,
            recommendationJson: task.recommendationJson,
          }
        : undefined,
      article: {
        topic: resolvedTopic,
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

    const pipeline = await runArticleQualityPipeline({
      article: hermesResult,
      targetKeyword,
      topic: resolvedTopic,
      website: {
        url: website.url,
        niche: website.niche,
        language: language.toLowerCase(),
      },
    });

    const finalResult = pipeline.article;
    const generateMetadata = hermesResult.metadata;
    const generateCostCents = generateMetadata?.costCents ?? 0;
    const repairCostCents = pipeline.repairUsages.reduce(
      (sum, usage) => sum + usage.costCents,
      0
    );
    const totalCostCents = generateCostCents + repairCostCents;

    const article = await prisma.$transaction(async (tx) => {
      const createdArticle = await tx.article.create({
        data: {
          websiteId: website.id,
          organizationId: organization.id,
          title: finalResult.title,
          slug: finalResult.slug,
          language,
          status: ArticleStatus.DRAFT,
          topic,
          targetKeyword,
          metaTitle: finalResult.metaTitle,
          metaDescription: finalResult.metaDescription,
          contentHtml: finalResult.contentHtml,
          faqJson:
            finalResult.faqJson === null || finalResult.faqJson === undefined
              ? undefined
              : (finalResult.faqJson as object),
          schemaJson:
            finalResult.schemaJson === null ||
            finalResult.schemaJson === undefined
              ? undefined
              : (finalResult.schemaJson as object),
          generatedByAIJobId: aiJob.id,
          qualityScore: pipeline.qualityScore,
          qualityPassed: pipeline.qualityPassed,
          qualityIssuesJson: pipeline.qualityIssuesJson as object,
          qualityRepairAttempts: pipeline.repairAttempts,
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
          outputJson: JSON.parse(JSON.stringify(finalResult)) as object,
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

      for (const repairUsage of pipeline.repairUsages) {
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
          title: "Статья создана",
          description: createdArticle.title,
          metadataJson: {
            articleId: createdArticle.id,
            aiJobId: aiJob.id,
            source: task ? "task" : "manual",
          },
        },
      });

      await tx.activity.create({
        data: {
          organizationId: organization.id,
          websiteId: website.id,
          userId: input.userId,
          type: ActivityType.ARTICLE_VALIDATED,
          title: "Статья проверена",
          description: createdArticle.title,
          metadataJson: {
            articleId: createdArticle.id,
            qualityScore: pipeline.qualityScore,
            qualityPassed: pipeline.qualityPassed,
          },
        },
      });

      if (pipeline.repairAttempts > 0) {
        await tx.activity.create({
          data: {
            organizationId: organization.id,
            websiteId: website.id,
            userId: input.userId,
            type: ActivityType.ARTICLE_REPAIRED,
            title: "Статья улучшена",
            description: createdArticle.title,
            metadataJson: {
              articleId: createdArticle.id,
              repairAttempts: pipeline.repairAttempts,
              qualityScore: pipeline.qualityScore,
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

      const issuesCount =
        pipeline.qualityIssuesJson.items?.filter(
          (item) => item.status !== "fixed"
        ).length ?? 0;

      await timelineAfterQualityCheck({
        userId: input.userId,
        websiteId: website.id,
        articleId: article.id,
        title: article.title,
        qualityScore: pipeline.qualityScore,
        qualityPassed: pipeline.qualityPassed,
        issuesCount,
      });
    } catch {
      // Timeline sync must not block article generation.
    }

    return serializeArticleRecord(article, wordpressConnected);
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
            : "Не удалось сгенерировать статью",
      },
    });

    throw error;
  }
}
