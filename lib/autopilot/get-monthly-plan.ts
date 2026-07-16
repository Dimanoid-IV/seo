import "server-only";

import {
  WordPressConnectionStatus,
} from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

import { getAutopilotSettings } from "./autopilot-settings";
import { getAutopilotStatusSnapshot } from "./autopilot-status";
import { formatMonthlyAutopilotPlan } from "./format";
import {
  buildPlanItemsFromRecommendedActions,
  enrichPlanItemsFromEntities,
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

    const [autopilotSettings, autopilotStatus, wpConnection, tasks] =
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
      ]);

    const wordpressConnected =
      wpConnection?.status === WordPressConnectionStatus.CONNECTED;

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

    if (planItems) {
      planItems = enrichPlanItemsFromEntities({
        document: planItems,
        tasks,
        wordpressConnected,
      });
    }

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
    };
  } catch {
    return {
      plan: null,
      month,
      websiteId: null,
      websiteUrl: null,
      sourceSummary: null,
    };
  }
}
