import "server-only";

import {
  AIJobStatus,
  AIJobType,
  AIUsagePurpose,
  ArticleStatus,
  AuditStatus,
  IntegrationProvider,
  IntegrationStatus,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TimelineEventSource,
  WebsiteLanguage,
  WebsiteStatus,
} from "@prisma/client";

import { findPrimaryOrganization } from "@/lib/auth/queries";
import { assertUsageLimit, recordUsage } from "@/lib/billing/feature-gates";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { generateRecommendations, isHermesConfigured } from "@/lib/hermes/client";
import {
  buildHermesSystemInstructions,
  HERMES_REVIEW_CONSTRAINTS,
  hermesLocaleFromSaasLocale,
} from "@/lib/hermes/prompts";
import type {
  HermesRecommendationType,
  HermesRecommendationsResult,
} from "@/lib/hermes/types";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { extractGscMetricsSummary } from "@/lib/integrations/gsc-metrics";
import { sortGrowthOpportunities } from "@/lib/growth/opportunities";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";
import { timelineAfterTasksCreatedBatch } from "@/lib/timeline/hooks";

const MAX_SEO_TASKS = 5;

export type RecommendationGenerationType = HermesRecommendationType;

export type GenerateRecommendationsInput = {
  userId: string;
  organizationId?: string | null;
  websiteId?: string | null;
  type: RecommendationGenerationType;
  locale: SaasLocale;
};

export type GeneratedRecommendationTask = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string;
};

export type GeneratedContentBrief = {
  id: string;
  title: string;
  topic: string | null;
  targetKeyword: string | null;
  status: string;
};

export type GenerateRecommendationsResult = {
  type: RecommendationGenerationType;
  title: string;
  summary: string;
  persisted: boolean;
  reviewStatus: "DRAFT" | "NEEDS_REVIEW";
  basedOnLimitedData: boolean;
  tasks?: GeneratedRecommendationTask[];
  contentBrief?: GeneratedContentBrief;
  preview?: HermesRecommendationsResult;
  aiJobId: string;
};

function mapCategory(value: string | undefined): TaskCategory {
  if (!value) {
    return TaskCategory.OTHER;
  }
  const normalized = value.toUpperCase();
  if (Object.values(TaskCategory).includes(normalized as TaskCategory)) {
    return normalized as TaskCategory;
  }
  return TaskCategory.OTHER;
}

function mapPriority(value: string): TaskPriority {
  const normalized = value.toUpperCase();
  if (normalized === "CRITICAL") {
    return TaskPriority.CRITICAL;
  }
  if (normalized === "HIGH") {
    return TaskPriority.HIGH;
  }
  if (normalized === "LOW") {
    return TaskPriority.LOW;
  }
  return TaskPriority.MEDIUM;
}

function mapWebsiteLanguage(locale: SaasLocale): WebsiteLanguage {
  if (locale === "ru") {
    return WebsiteLanguage.RU;
  }
  if (locale === "et") {
    return WebsiteLanguage.ET;
  }
  return WebsiteLanguage.EN;
}

async function resolveWebsite(input: GenerateRecommendationsInput) {
  const prisma = getPrisma();

  let organization = input.organizationId
    ? await prisma.organization.findFirst({
        where: {
          id: input.organizationId,
          ownerUserId: input.userId,
          deletedAt: null,
        },
      })
    : null;

  if (!organization) {
    organization = await findPrimaryOrganization(prisma, input.userId);
  }

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
  }

  const website = input.websiteId
    ? await prisma.website.findFirst({
        where: {
          id: input.websiteId,
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
      })
    : await prisma.website.findFirst({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
      });

  if (!website) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Add a website before generating recommendations."
    );
  }

  return { organization, website };
}

async function loadRecommendationContext(
  websiteId: string,
  organizationId: string,
  userId: string
) {
  const prisma = getPrisma();

  const [latestAudit, gscIntegration, openTasksCount, opportunitiesRaw] =
    await Promise.all([
      prisma.audit.findFirst({
        where: { websiteId, status: AuditStatus.COMPLETED },
        orderBy: { completedAt: "desc" },
        select: {
          id: true,
          growthScore: true,
          checks: {
            where: {
              status: { in: ["FAIL", "WARNING"] },
            },
            take: 8,
            orderBy: { scoreImpact: "desc" },
            select: {
              title: true,
              category: true,
              severity: true,
            },
          },
        },
      }),
      prisma.integration.findFirst({
        where: {
          websiteId,
          provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
          status: IntegrationStatus.CONNECTED,
        },
        select: {
          googleData: {
            select: { metricsJson: true },
          },
        },
      }),
      prisma.task.count({
        where: {
          websiteId,
          deletedAt: null,
          status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
        },
      }),
      syncGrowthOpportunitiesForWebsite({
        websiteId,
        organizationId,
        userId,
      }),
    ]);

  const opportunities = sortGrowthOpportunities(opportunitiesRaw).slice(0, 5);

  const hasAudit = Boolean(latestAudit);
  const hasGsc = Boolean(gscIntegration);
  const gscSummary = gscIntegration?.googleData?.metricsJson
    ? extractGscMetricsSummary(gscIntegration.googleData.metricsJson)
    : null;

  return {
    hasAudit,
    hasGsc,
    growthScore: latestAudit?.growthScore ?? null,
    basedOnLimitedData: !hasAudit && !hasGsc,
    auditFindings:
      latestAudit?.checks.map((check) => ({
        title: check.title,
        category: check.category,
        severity: check.severity,
      })) ?? [],
    gscSummary,
    openTasksCount,
    opportunities: opportunities.map((item) => ({
      title: item.title,
      type: item.type,
    })),
  };
}

function mapAiJobType(type: RecommendationGenerationType): AIJobType {
  if (type === "content_brief") {
    return AIJobType.GENERATE_ARTICLE;
  }
  if (type === "monthly_plan") {
    return AIJobType.GENERATE_MONTHLY_PLAN;
  }
  return AIJobType.GENERATE_TASKS;
}

/**
 * Generates review-first AI recommendations via Hermes and persists drafts where supported.
 */
export async function generateRecommendationsForWebsite(
  input: GenerateRecommendationsInput
): Promise<GenerateRecommendationsResult> {
  if (!isHermesConfigured()) {
    throw new AppError(
      ErrorCode.HERMES_UNAVAILABLE,
      "AI engine is not configured yet."
    );
  }

  const prisma = getPrisma();
  const { organization, website } = await resolveWebsite(input);

  await assertUsageLimit({
    userId: input.userId,
    organizationId: organization.id,
    websiteId: website.id,
    key: "AI_GENERATION",
    message:
      "You've reached the monthly AI generation limit for your current plan. Upgrade to continue.",
  });

  const context = await loadRecommendationContext(
    website.id,
    organization.id,
    input.userId
  );
  const hermesLocale = hermesLocaleFromSaasLocale(input.locale);

  const aiJob = await prisma.aIJob.create({
    data: {
      websiteId: website.id,
      organizationId: organization.id,
      userId: input.userId,
      type: mapAiJobType(input.type),
      status: AIJobStatus.RUNNING,
      inputJson: {
        recommendationType: input.type,
        locale: input.locale,
      },
      startedAt: new Date(),
    },
  });

  try {
    const hermesResult = await generateRecommendations({
      type: input.type,
      locale: hermesLocale,
      website: {
        url: website.url,
        name: website.displayName,
        niche: website.niche,
        language: website.primaryLanguage,
      },
      context,
      constraints: HERMES_REVIEW_CONSTRAINTS,
      systemInstructions: buildHermesSystemInstructions(input.locale),
    });

    if (input.type === "seo_tasks") {
      const createdTasks = await prisma.$transaction(async (tx) => {
        const tasks = [];
        for (const item of hermesResult.items.slice(0, MAX_SEO_TASKS)) {
          const task = await tx.task.create({
            data: {
              websiteId: website.id,
              organizationId: organization.id,
              title: item.title,
              description: item.description,
              category: mapCategory(item.category),
              priority: mapPriority(item.priority),
              status: TaskStatus.OPEN,
              source: TaskSource.AI,
              recommendationJson: {
                rationale: item.rationale ?? null,
                basedOnLimitedData:
                  item.basedOnLimitedData ?? context.basedOnLimitedData,
                reviewStatus: "NEEDS_REVIEW",
                generatedBy: "hermes",
                aiJobId: aiJob.id,
              },
            },
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              status: true,
              category: true,
            },
          });
          tasks.push(task);
        }
        return tasks;
      });

      await timelineAfterTasksCreatedBatch({
        userId: input.userId,
        websiteId: website.id,
        tasks: createdTasks.map((task) => ({ id: task.id, title: task.title })),
        source: TimelineEventSource.HERMES,
      });

      await prisma.aIUsage.create({
        data: {
          websiteId: website.id,
          organizationId: organization.id,
          userId: input.userId,
          aiJobId: aiJob.id,
          provider: hermesResult.metadata?.provider ?? "hermes",
          purpose: AIUsagePurpose.CONTENT_GENERATION,
          model: hermesResult.metadata?.model ?? "unknown",
          inputTokens: hermesResult.metadata?.inputTokens ?? null,
          outputTokens: hermesResult.metadata?.outputTokens ?? null,
          totalTokens: hermesResult.metadata?.totalTokens ?? null,
          costCents: hermesResult.metadata?.costCents ?? 0,
        },
      });

      await prisma.aIJob.update({
        where: { id: aiJob.id },
        data: {
          status: AIJobStatus.COMPLETED,
          outputJson: {
            taskIds: createdTasks.map((task) => task.id),
            title: hermesResult.title,
          },
          completedAt: new Date(),
        },
      });

      await recordUsage({
        userId: input.userId,
        organizationId: organization.id,
        websiteId: website.id,
        key: "AI_GENERATION",
      });

      return {
        type: input.type,
        title: hermesResult.title,
        summary: hermesResult.summary,
        persisted: true,
        reviewStatus: "NEEDS_REVIEW",
        basedOnLimitedData: context.basedOnLimitedData,
        tasks: createdTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          category: task.category,
        })),
        aiJobId: aiJob.id,
      };
    }

    if (input.type === "content_brief") {
      const firstItem = hermesResult.items[0];
      const article = await prisma.article.create({
        data: {
          websiteId: website.id,
          organizationId: organization.id,
          title: firstItem.title,
          topic: firstItem.topic ?? firstItem.title,
          targetKeyword: firstItem.targetKeyword ?? null,
          language: mapWebsiteLanguage(input.locale),
          status: ArticleStatus.IDEA,
          contentJson: {
            brief: {
              summary: hermesResult.summary,
              outline: firstItem.outline ?? [],
              rationale: firstItem.rationale ?? null,
              basedOnLimitedData:
                firstItem.basedOnLimitedData ?? context.basedOnLimitedData,
            },
            reviewStatus: "NEEDS_REVIEW",
            generatedBy: "hermes",
          },
          generatedByAIJobId: aiJob.id,
        },
        select: {
          id: true,
          title: true,
          topic: true,
          targetKeyword: true,
          status: true,
        },
      });

      await prisma.aIUsage.create({
        data: {
          websiteId: website.id,
          organizationId: organization.id,
          userId: input.userId,
          aiJobId: aiJob.id,
          provider: hermesResult.metadata?.provider ?? "hermes",
          purpose: AIUsagePurpose.CONTENT_GENERATION,
          model: hermesResult.metadata?.model ?? "unknown",
          inputTokens: hermesResult.metadata?.inputTokens ?? null,
          outputTokens: hermesResult.metadata?.outputTokens ?? null,
          totalTokens: hermesResult.metadata?.totalTokens ?? null,
          costCents: hermesResult.metadata?.costCents ?? 0,
        },
      });

      await prisma.aIJob.update({
        where: { id: aiJob.id },
        data: {
          status: AIJobStatus.COMPLETED,
          outputJson: { articleId: article.id, title: hermesResult.title },
          completedAt: new Date(),
        },
      });

      await recordUsage({
        userId: input.userId,
        organizationId: organization.id,
        websiteId: website.id,
        key: "AI_GENERATION",
      });

      return {
        type: input.type,
        title: hermesResult.title,
        summary: hermesResult.summary,
        persisted: true,
        reviewStatus: "NEEDS_REVIEW",
        basedOnLimitedData: context.basedOnLimitedData,
        contentBrief: {
          id: article.id,
          title: article.title,
          topic: article.topic,
          targetKeyword: article.targetKeyword,
          status: article.status,
        },
        aiJobId: aiJob.id,
      };
    }

    await prisma.aIJob.update({
      where: { id: aiJob.id },
      data: {
        status: AIJobStatus.COMPLETED,
        outputJson: hermesResult,
        completedAt: new Date(),
      },
    });

    await prisma.aIUsage.create({
      data: {
        websiteId: website.id,
        organizationId: organization.id,
        userId: input.userId,
        aiJobId: aiJob.id,
        provider: hermesResult.metadata?.provider ?? "hermes",
        purpose: AIUsagePurpose.CONTENT_GENERATION,
        model: hermesResult.metadata?.model ?? "unknown",
        inputTokens: hermesResult.metadata?.inputTokens ?? null,
        outputTokens: hermesResult.metadata?.outputTokens ?? null,
        totalTokens: hermesResult.metadata?.totalTokens ?? null,
        costCents: hermesResult.metadata?.costCents ?? 0,
      },
    });

    await recordUsage({
      userId: input.userId,
      organizationId: organization.id,
      websiteId: website.id,
      key: "AI_GENERATION",
    });

    return {
      type: input.type,
      title: hermesResult.title,
      summary: hermesResult.summary,
      persisted: false,
      reviewStatus: "NEEDS_REVIEW",
      basedOnLimitedData: context.basedOnLimitedData,
      preview: hermesResult,
      aiJobId: aiJob.id,
    };
  } catch (error) {
    await prisma.aIJob.update({
      where: { id: aiJob.id },
      data: {
        status: AIJobStatus.FAILED,
        errorMessage:
          error instanceof Error ? error.message.slice(0, 500) : "Generation failed",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
