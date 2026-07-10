import type { MonthlyAutopilotPlan } from "@prisma/client";

import type {
  AutopilotFocusArea,
  AutopilotNextStep,
  AutopilotRecommendedAction,
  AutopilotRisk,
  MonthlyAutopilotMetrics,
  MonthlyAutopilotPlanViewModel,
} from "./types";
import { parsePlanItemsDocument } from "./plan-items";
import type { AutopilotPlanItemsDocument } from "./plan-item-types";

function parseJsonArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as T[];
}

function parseMetrics(value: unknown): MonthlyAutopilotMetrics {
  const record = value as MonthlyAutopilotMetrics | null;
  return {
    growthScore: record?.growthScore,
    growthScoreDelta: record?.growthScoreDelta,
    openTasksCount: record?.openTasksCount ?? 0,
    completedTasksCount: record?.completedTasksCount ?? 0,
    opportunitiesCount: record?.opportunitiesCount ?? 0,
    warningsCount: record?.warningsCount ?? 0,
    draftArticlesCount: record?.draftArticlesCount ?? 0,
    readySocialPostsCount: record?.readySocialPostsCount ?? 0,
  };
}

export function formatMonthlyAutopilotPlan(
  plan: MonthlyAutopilotPlan
): MonthlyAutopilotPlanViewModel {
  return {
    id: plan.id,
    month: plan.month,
    status: plan.status.toLowerCase(),
    title: plan.title,
    summary: plan.summary ?? "",
    metrics: parseMetrics(plan.metricsJson),
    focusAreas: parseJsonArray<AutopilotFocusArea>(plan.focusAreasJson),
    recommendedActions: parseJsonArray<AutopilotRecommendedAction>(
      plan.recommendationsJson
    ),
    risks: parseJsonArray<AutopilotRisk>(plan.risksJson),
    nextSteps: parseJsonArray<AutopilotNextStep>(plan.nextActionsJson),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    approvedAt: plan.approvedAt?.toISOString(),
    planItems: parsePlanItemsDocument(plan.planItemsJson),
  };
}

export function extractPlanItemsFromRecord(
  plan: Pick<MonthlyAutopilotPlan, "planItemsJson">
): AutopilotPlanItemsDocument | null {
  return parsePlanItemsDocument(plan.planItemsJson);
}
