import "server-only";

import {
  WordPressConnectionStatus,
} from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { isWebsiteOnLivePublishAllowlist } from "@/lib/integrations/live-publish-rollout";

import { getAutopilotSettings } from "./autopilot-settings";
import { getAutopilotStatusSnapshot } from "./autopilot-status";
import { buildAutopilotAiVisibilitySnapshot } from "./ai-visibility-snapshot";
import { formatMonthlyAutopilotPlan } from "./format";
import {
  buildPlanItemsFromRecommendedActions,
  enrichPlanItemsFromEntities,
  ensureStrategicArticleTopicDepth,
  planItemsToJson,
  resolvePlanItemsDocumentFromPlan,
} from "./plan-items";
import { reconcileMonthlyPlanMetrics } from "./plan-metrics-reconcile";
import { currentMonthKey, normalizeMonthKey } from "./month-utils";
import { resolveWebsiteForAutopilot } from "./resolve-website";
import { getMonthlyAutopilotSourceData } from "./source-data";
import type { MonthlyAutopilotGetResponse } from "./types";

export async function getMonthlyAutopilotPlan(input: {
  currentUser: CurrentUser;
  month?: string;
  websiteId?: string | null;
}): Promise<MonthlyAutopilotGetResponse> {
  const month = input.month ? normalizeMonthKey(input.month) : currentMonthKey();

  try {
    const { organization, website } = await resolveWebsiteForAutopilot(
      input.currentUser.id,
      input.currentUser.organizationId,
      input.websiteId
    );

    const prisma = getPrisma();

    const plan = await prisma.monthlyAutopilotPlan.findUnique({
      where: {
        websiteId_month: {
          websiteId: website.id,
          month,
        },
      },
    });

    const sourceData = await getMonthlyAutopilotSourceData({
      userId: input.currentUser.id,
      websiteId: website.id,
      organizationId: organization.id,
      month,
    });

    const [autopilotSettings, autopilotStatus, wpConnection, tasks, lastPublished] =
      await Promise.all([
        getAutopilotSettings({
          userId: input.currentUser.id,
          organizationId: input.currentUser.organizationId,
          websiteId: website.id,
        }),
        getAutopilotStatusSnapshot({
          currentUser: input.currentUser,
          websiteId: website.id,
        }),
        getPrisma().wordPressConnection.findFirst({
          where: { websiteId: website.id },
          select: { status: true },
        }),
        getPrisma().task.findMany({
          where: { websiteId: website.id, deletedAt: null },
          select: { id: true, recommendationJson: true, status: true },
          take: 50,
        }),
        getPrisma().article.findFirst({
          where: {
            websiteId: website.id,
            deletedAt: null,
            wordpressPublishedUrl: { not: null },
          },
          orderBy: { publishedAt: "desc" },
          select: { wordpressPublishedUrl: true, status: true },
        }),
      ]);

    const wordpressConnected =
      wpConnection?.status === WordPressConnectionStatus.CONNECTED;

    const livePublishScopedAllowed = isWebsiteOnLivePublishAllowlist(
      website.id,
      {
        dbRolloutEnabled:
          autopilotSettings.livePublishRolloutEnabled === true,
      }
    );

    const baseFormattedPlan =
      plan && !plan.archivedAt ? formatMonthlyAutopilotPlan(plan) : null;

    // Live-derive current-plan task counts so a stale metricsJson snapshot can
    // never make the Autopilot UI show phantom open tasks. Historical snapshot
    // counts (opportunities/warnings/drafts) are preserved.
    const formattedPlan = baseFormattedPlan
      ? {
          ...baseFormattedPlan,
          metrics: reconcileMonthlyPlanMetrics(baseFormattedPlan.metrics, tasks),
        }
      : null;

    let planItems = resolvePlanItemsDocumentFromPlan({
      planItemsJson: plan?.planItemsJson,
      recommendationsJson: plan?.recommendationsJson,
      taskIds: plan?.taskIds ?? [],
      articleIds: plan?.articleIds ?? [],
      socialPostIds: plan?.socialPostIds ?? [],
    });

    if (!planItems && formattedPlan && formattedPlan.recommendedActions.length > 0) {
      planItems = buildPlanItemsFromRecommendedActions({
        recommendedActions: formattedPlan.recommendedActions,
        taskIds: plan?.taskIds ?? [],
        articleIds: plan?.articleIds ?? [],
        socialPostIds: plan?.socialPostIds ?? [],
      });
    }

    if (plan && !plan.archivedAt && planItems) {
      const replenished = ensureStrategicArticleTopicDepth({
        document: planItems,
        data: sourceData,
        articleIntegration: wordpressConnected ? "none" : "wordpress",
      });
      if (replenished.addedCount > 0) {
        planItems = replenished.document;
        await prisma.monthlyAutopilotPlan.update({
          where: { id: plan.id },
          data: { planItemsJson: planItemsToJson(planItems) },
        });
      }
    }

    if (planItems) {
      planItems = enrichPlanItemsFromEntities({
        document: planItems,
        tasks,
        wordpressConnected,
      });
    }

    const aiVisibility = buildAutopilotAiVisibilitySnapshot({
      document: planItems,
      readinessScore: website.currentAIReadinessScore,
    });

    return {
      plan: formattedPlan
        ? { ...formattedPlan, planItems: planItems ?? formattedPlan.planItems }
        : null,
      month,
      websiteId: website.id,
      websiteUrl: website.url,
      sourceSummary: sourceData.sourceSummary,
      planItems,
      autopilotStatus,
      autopilotSettings,
      wordpressConnected,
      lastPublishedUrl: lastPublished?.wordpressPublishedUrl ?? null,
      rollbackAvailable: true,
      livePublishScopedAllowed,
      aiVisibility,
    };
  } catch {
    return {
      plan: null,
      month,
      websiteId: null,
      websiteUrl: null,
      sourceSummary: null,
      wordpressConnected: false,
      lastPublishedUrl: null,
      rollbackAvailable: true,
      livePublishScopedAllowed: false,
    };
  }
}
