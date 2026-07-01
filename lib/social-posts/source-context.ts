import {
  ArticleStatus,
  IntegrationProvider,
  IntegrationStatus,
  SocialPostSource,
  TaskStatus,
} from "@prisma/client";

import { findGrowthOpportunities } from "@/lib/growth/opportunities";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { extractGscMetricsSummary } from "@/lib/integrations/gsc-metrics";
import { generateGscInsights } from "@/lib/integrations/gsc-insights";

export type SocialPostSourceContext = {
  source: SocialPostSource;
  sourceId: string | null;
  articleId?: string | null;
  context: Record<string, unknown>;
};

export async function loadSocialPostSourceContext(input: {
  websiteId: string;
  userId: string;
  source: SocialPostSource;
  sourceId?: string | null;
}): Promise<SocialPostSourceContext> {
  const prisma = getPrisma();

  switch (input.source) {
    case SocialPostSource.TASK: {
      const task = input.sourceId
        ? await prisma.task.findFirst({
            where: {
              id: input.sourceId,
              websiteId: input.websiteId,
              deletedAt: null,
              organization: { ownerUserId: input.userId, deletedAt: null },
            },
          })
        : await prisma.task.findFirst({
            where: {
              websiteId: input.websiteId,
              deletedAt: null,
              status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
            },
            orderBy: { updatedAt: "desc" },
          });

      if (!task) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "No task available for social post generation."
        );
      }

      return {
        source: SocialPostSource.TASK,
        sourceId: task.id,
        context: {
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
        },
      };
    }

    case SocialPostSource.ARTICLE:
    case SocialPostSource.CONTENT_IDEA: {
      const article = input.sourceId
        ? await prisma.article.findFirst({
            where: {
              id: input.sourceId,
              websiteId: input.websiteId,
              deletedAt: null,
              organization: { ownerUserId: input.userId, deletedAt: null },
            },
          })
        : await prisma.article.findFirst({
            where: {
              websiteId: input.websiteId,
              deletedAt: null,
              status: {
                in: [
                  ArticleStatus.IDEA,
                  ArticleStatus.DRAFT,
                  ArticleStatus.APPROVED,
                ],
              },
            },
            orderBy: { updatedAt: "desc" },
          });

      if (!article) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "No article available for social post generation."
        );
      }

      return {
        source: input.source,
        sourceId: article.id,
        articleId: article.id,
        context: {
          title: article.title,
          topic: article.topic,
          targetKeyword: article.targetKeyword,
          metaDescription: article.metaDescription,
          language: article.language,
        },
      };
    }

    case SocialPostSource.GSC_INSIGHT: {
      const integration = await prisma.integration.findFirst({
        where: {
          websiteId: input.websiteId,
          provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
          status: IntegrationStatus.CONNECTED,
        },
        select: {
          googleData: { select: { metricsJson: true } },
        },
      });

      const summary = integration?.googleData?.metricsJson
        ? extractGscMetricsSummary(integration.googleData.metricsJson)
        : null;

      if (!summary) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Connect Google Search Console first."
        );
      }

      const insights = generateGscInsights(summary);
      const insight = insights[0];

      if (!insight) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "No Search Console insights available yet."
        );
      }

      return {
        source: SocialPostSource.GSC_INSIGHT,
        sourceId: insight.code,
        context: {
          insight,
          metrics: summary,
        },
      };
    }

    case SocialPostSource.TIMELINE_EVENT: {
      const event = input.sourceId
        ? await prisma.timelineEvent.findFirst({
            where: {
              id: input.sourceId,
              websiteId: input.websiteId,
              userId: input.userId,
            },
          })
        : await prisma.timelineEvent.findFirst({
            where: { websiteId: input.websiteId, userId: input.userId },
            orderBy: { createdAt: "desc" },
          });

      if (!event) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "No timeline events available yet."
        );
      }

      return {
        source: SocialPostSource.TIMELINE_EVENT,
        sourceId: event.id,
        context: {
          title: event.title,
          summary: event.summary,
          details: event.details,
          type: event.type,
        },
      };
    }

    case SocialPostSource.GROWTH_SCORE: {
      const snapshot = await prisma.growthScoreSnapshot.findFirst({
        where: { websiteId: input.websiteId },
        orderBy: { createdAt: "desc" },
      });

      if (!snapshot) {
        throw new AppError(ErrorCode.NOT_FOUND, "No Growth Score data yet.");
      }

      return {
        source: SocialPostSource.GROWTH_SCORE,
        sourceId: snapshot.id,
        context: {
          score: snapshot.score,
          previousScore: snapshot.previousScore,
          delta: snapshot.delta,
          reason: snapshot.reason,
        },
      };
    }

    case SocialPostSource.CONTINUOUS_IMPROVEMENT: {
      const opportunities = await findGrowthOpportunities(input.websiteId);
      const opportunity = input.sourceId
        ? opportunities.find((item) => item.id === input.sourceId)
        : opportunities[0];

      if (!opportunity) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "No growth opportunities available yet."
        );
      }

      return {
        source: SocialPostSource.CONTINUOUS_IMPROVEMENT,
        sourceId: opportunity.id,
        context: opportunity,
      };
    }

    default:
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Manual posts must be created directly."
      );
  }
}
