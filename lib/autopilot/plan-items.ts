import "server-only";

import type { MonthlyAutopilotStatus, Prisma } from "@prisma/client";

import { parsePreparedFix } from "@/lib/tasks/prepared-fix";

import type { MonthlyAutopilotSourceData } from "./source-data";
import { assignEveryOtherDaySlots } from "./scheduling";
import type { AutopilotRecommendedAction } from "./types";
import {
  AUTOPILOT_PLAN_ITEMS_VERSION,
  type AutopilotPlanItem,
  type AutopilotPlanItemIntegration,
  type AutopilotPlanItemStatus,
  type AutopilotPlanItemsDocument,
  type AutopilotPlanPeriod,
} from "./plan-item-types";

let itemCounter = 0;

function nextItemId(): string {
  itemCounter += 1;
  return `plan-item-${itemCounter}`;
}

function integrationContext(data: MonthlyAutopilotSourceData) {
  return {
    wordpressConnected: data.integrations.wordpressConnected,
    gscConnected: data.integrations.gscConnected,
  };
}

function articleIntegration(
  integrations: ReturnType<typeof integrationContext>
): AutopilotPlanItemIntegration {
  return integrations.wordpressConnected ? "none" : "wordpress";
}

function buildTaskFixItem(
  task: { id: string; title: string; category: string; priority: string },
  reason: string,
  riskLevel: AutopilotPlanItem["riskLevel"] = "medium"
): AutopilotPlanItem {
  return {
    id: nextItemId(),
    type: "TASK_FIX",
    title: task.title,
    reason,
    riskLevel,
    needsIntegration: false,
    integrationType: "manual",
    status: "proposed",
    selected: true,
    sourceRef: { type: "task", id: task.id },
    reviewQueueHref: "/app/review",
  };
}

export function buildPlanItemsFromRecommendedActions(input: {
  recommendedActions: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
  }>;
  taskIds: string[];
  articleIds: string[];
  socialPostIds: string[];
}): AutopilotPlanItemsDocument {
  itemCounter = 0;
  const items: AutopilotPlanItem[] = [];

  for (const action of input.recommendedActions.slice(0, 8)) {
    let type: AutopilotPlanItem["type"] = "TASK_FIX";
    if (action.type === "ARTICLE" || action.type === "REVIEW") {
      type = "ARTICLE";
    } else if (action.type === "SOCIAL_POST") {
      type = "SOCIAL_POST";
    } else if (action.type === "INTEGRATION") {
      type = "SEO_FIX";
    }

    items.push({
      id: action.id ? `plan-item-${action.id}` : nextItemId(),
      type,
      title: action.title,
      reason: action.description,
      riskLevel: "medium",
      needsIntegration: action.type === "ARTICLE",
      integrationType: action.type === "ARTICLE" ? "wordpress" : "manual",
      status: "proposed",
      selected: true,
      reviewQueueHref: "/app/review",
    });
  }

  return {
    version: AUTOPILOT_PLAN_ITEMS_VERSION,
    period: "monthly",
    items,
  };
}

export function buildPlanItemsFromSource(
  data: MonthlyAutopilotSourceData,
  period: AutopilotPlanPeriod = "monthly"
): AutopilotPlanItemsDocument {
  itemCounter = 0;
  const integrations = integrationContext(data);
  const items: AutopilotPlanItem[] = [];

  for (const task of data.tasks.highPriority.slice(0, 5)) {
    items.push(
      buildTaskFixItem(
        task,
        `High-priority ${task.category.toLowerCase()} task from your growth audit.`,
        task.priority === "CRITICAL" || task.priority === "HIGH"
          ? "high"
          : "medium"
      )
    );
  }

  for (const article of data.articles.waitingReview.slice(0, 3)) {
    const needsWp = !integrations.wordpressConnected;
    items.push({
      id: nextItemId(),
      type: "ARTICLE",
      title: article.title,
      reason: "Article draft is ready for review and scheduling.",
      riskLevel: "medium",
      needsIntegration: needsWp,
      integrationType: articleIntegration(integrations),
      status: needsWp ? "proposed" : "proposed",
      selected: true,
      sourceRef: { type: "article", id: article.id },
      reviewQueueHref: "/app/review",
      blockedReasonKey: needsWp ? "wordpressNotConnected" : undefined,
    });
  }

  for (const article of data.articles.drafts.slice(0, 2)) {
    const needsWp = !integrations.wordpressConnected;
    items.push({
      id: nextItemId(),
      type: "ARTICLE",
      title: article.title,
      reason: article.targetKeyword
        ? `Finish and schedule content for “${article.targetKeyword}”.`
        : "Continue this article draft for your content plan.",
      riskLevel: "low",
      needsIntegration: needsWp,
      integrationType: articleIntegration(integrations),
      status: "proposed",
      selected: true,
      sourceRef: { type: "article", id: article.id },
      reviewQueueHref: "/app/review",
      blockedReasonKey: needsWp ? "wordpressNotConnected" : undefined,
    });
  }

  for (const post of data.socialPosts.ready.slice(0, 3)) {
    items.push({
      id: nextItemId(),
      type: "SOCIAL_POST",
      title: post.title ?? `${post.platform} post draft`,
      reason: "Social post draft ready — will stay in Review Queue until you copy or approve.",
      riskLevel: "low",
      needsIntegration: false,
      integrationType: "manual",
      status: "proposed",
      selected: true,
      sourceRef: { type: "social_post", id: post.id },
      reviewQueueHref: "/app/review",
    });
  }

  for (const finding of (data.audit?.criticalFindings ?? []).slice(0, 2)) {
    items.push({
      id: nextItemId(),
      type: "SEO_FIX",
      title: finding.title,
      reason: "Critical audit finding — RankBoost can prepare a safe fix for review.",
      riskLevel: "high",
      needsIntegration: false,
      integrationType: "manual",
      status: "proposed",
      selected: true,
      sourceRef: { type: "action", id: finding.id },
      reviewQueueHref: "/app/review",
    });
  }

  return {
    version: AUTOPILOT_PLAN_ITEMS_VERSION,
    period,
    items: items.slice(0, 12),
  };
}

export function parsePlanItemsDocument(
  value: unknown
): AutopilotPlanItemsDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.version !== AUTOPILOT_PLAN_ITEMS_VERSION) {
    return null;
  }

  if (!Array.isArray(record.items)) {
    return null;
  }

  const period = record.period === "weekly" ? "weekly" : "monthly";
  const itemsApprovedAt =
    typeof record.itemsApprovedAt === "string"
      ? record.itemsApprovedAt
      : undefined;

  const items = record.items
    .map(parsePlanItem)
    .filter((item): item is AutopilotPlanItem => item !== null);

  return {
    version: AUTOPILOT_PLAN_ITEMS_VERSION,
    period,
    items,
    itemsApprovedAt,
  };
}

function parsePlanItem(value: unknown): AutopilotPlanItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : null;
  const title = typeof record.title === "string" ? record.title : null;
  const reason = typeof record.reason === "string" ? record.reason : null;
  const type = record.type;
  const status = record.status;

  if (
    !id ||
    !title ||
    !reason ||
    typeof type !== "string" ||
    typeof status !== "string"
  ) {
    return null;
  }

  const validTypes = [
    "ARTICLE",
    "SEO_FIX",
    "SOCIAL_POST",
    "EMAIL",
    "TASK_FIX",
  ] as const;
  if (!validTypes.includes(type as (typeof validTypes)[number])) {
    return null;
  }

  const validStatuses = [
    "proposed",
    "approved",
    "scheduled",
    "prepared",
    "published",
    "executed",
    "skipped",
    "blocked",
  ] as const;
  if (!validStatuses.includes(status as AutopilotPlanItemStatus)) {
    return null;
  }

  const riskLevel =
    record.riskLevel === "low" ||
    record.riskLevel === "medium" ||
    record.riskLevel === "high"
      ? record.riskLevel
      : "medium";

  const integrationType =
    record.integrationType === "wordpress" ||
    record.integrationType === "gsc" ||
    record.integrationType === "manual" ||
    record.integrationType === "none"
      ? record.integrationType
      : "none";

  let sourceRef: AutopilotPlanItem["sourceRef"];
  if (record.sourceRef && typeof record.sourceRef === "object") {
    const ref = record.sourceRef as Record<string, unknown>;
    if (typeof ref.type === "string" && typeof ref.id === "string") {
      sourceRef = { type: ref.type as NonNullable<typeof sourceRef>["type"], id: ref.id };
    }
  }

  return {
    id,
    type: type as AutopilotPlanItem["type"],
    title,
    reason,
    riskLevel,
    needsIntegration: Boolean(record.needsIntegration),
    integrationType,
    estimatedActionDate:
      typeof record.estimatedActionDate === "string"
        ? record.estimatedActionDate
        : undefined,
    scheduledFor:
      typeof record.scheduledFor === "string" ? record.scheduledFor : undefined,
    status: status as AutopilotPlanItemStatus,
    sourceRef,
    selected:
      typeof record.selected === "boolean" ? record.selected : undefined,
    reviewQueueHref:
      typeof record.reviewQueueHref === "string"
        ? record.reviewQueueHref
        : undefined,
    blockedReasonKey:
      typeof record.blockedReasonKey === "string"
        ? record.blockedReasonKey
        : undefined,
    researchBrief:
      record.researchBrief && typeof record.researchBrief === "object"
        ? (record.researchBrief as Record<string, unknown>)
        : undefined,
    generatedArticleId:
      typeof record.generatedArticleId === "string"
        ? record.generatedArticleId
        : undefined,
    articleQualityScore:
      typeof record.articleQualityScore === "number"
        ? record.articleQualityScore
        : undefined,
    articleQualityPassed:
      typeof record.articleQualityPassed === "boolean"
        ? record.articleQualityPassed
        : undefined,
    linkedArticleApprovedAt:
      typeof record.linkedArticleApprovedAt === "string"
        ? record.linkedArticleApprovedAt
        : undefined,
  };
}

export function planItemsToJson(
  document: AutopilotPlanItemsDocument
): Prisma.InputJsonValue {
  return document as unknown as Prisma.InputJsonValue;
}

type TaskRecommendationRow = {
  id: string;
  recommendationJson: unknown;
};

/** Refresh item statuses from linked tasks/articles (prepared fixes, etc.). */
export function enrichPlanItemsFromEntities(input: {
  document: AutopilotPlanItemsDocument;
  tasks: TaskRecommendationRow[];
  wordpressConnected: boolean;
}): AutopilotPlanItemsDocument {
  const taskById = new Map(input.tasks.map((t) => [t.id, t]));

  const items = input.document.items.map((item) => {
    let next = { ...item };

    if (item.sourceRef?.type === "task") {
      const task = taskById.get(item.sourceRef.id);
      const preparedFix = task
        ? parsePreparedFix(
            (task.recommendationJson as Record<string, unknown> | null)
              ?.preparedFix
          )
        : null;

      if (preparedFix?.status === "AWAITING_REVIEW") {
        next = {
          ...next,
          status:
            next.status === "proposed" ? next.status : ("prepared" as const),
          reviewQueueHref: "/app/review",
        };
      } else if (preparedFix?.status === "APPROVED") {
        next = {
          ...next,
          status: ["published", "executed"].includes(next.status)
            ? next.status
            : ("prepared" as const),
          reviewQueueHref: "/app/review",
        };
      }
    }

    return next;
  });

  return { ...input.document, items };
}

export function countPlanItemsByStatus(
  items: AutopilotPlanItem[]
): Record<AutopilotPlanItemStatus, number> {
  const counts: Record<AutopilotPlanItemStatus, number> = {
    proposed: 0,
    approved: 0,
    scheduled: 0,
    prepared: 0,
    published: 0,
    executed: 0,
    skipped: 0,
    blocked: 0,
  };

  for (const item of items) {
    counts[item.status] += 1;
  }

  return counts;
}

export function resolvePlanItemsDocumentFromPlan(input: {
  planItemsJson: unknown;
  recommendationsJson: unknown;
  taskIds: string[];
  articleIds: string[];
  socialPostIds: string[];
}): AutopilotPlanItemsDocument | null {
  const existing = input.planItemsJson
    ? parsePlanItemsDocument(input.planItemsJson)
    : null;

  if (existing?.items.length) {
    return existing;
  }

  const recommendedActions = Array.isArray(input.recommendationsJson)
    ? (input.recommendationsJson as AutopilotRecommendedAction[])
    : [];

  if (recommendedActions.length === 0) {
    return null;
  }

  return buildPlanItemsFromRecommendedActions({
    recommendedActions,
    taskIds: input.taskIds,
    articleIds: input.articleIds,
    socialPostIds: input.socialPostIds,
  });
}

/** Backfills scheduled states for legacy APPROVED plans that never persisted planItemsJson. */
export function repairApprovedPlanItemsDocument(input: {
  document: AutopilotPlanItemsDocument;
  planStatus: MonthlyAutopilotStatus;
  approvedAt: Date | null;
}): AutopilotPlanItemsDocument {
  if (input.planStatus !== "APPROVED") {
    return input.document;
  }

  const hasScheduled = input.document.items.some((item) =>
    ["scheduled", "prepared", "executed", "published"].includes(item.status)
  );

  if (hasScheduled) {
    return input.document;
  }

  const items = input.document.items.map((item) => {
    if (item.status !== "proposed") {
      return item;
    }

    return { ...item, status: "approved" as const };
  });

  const approvedIds = new Set(
    items.filter((item) => item.status === "approved").map((item) => item.id)
  );

  const scheduledItems = assignEveryOtherDaySlots({
    items,
    approvedItemIds: approvedIds,
    now: input.approvedAt ?? new Date(),
  });

  return {
    ...input.document,
    items: scheduledItems,
    itemsApprovedAt: input.approvedAt?.toISOString(),
  };
}

/**
 * WordPress is required only for publish/draft push, not internal article draft prep.
 * Unblocks ARTICLE items that were blocked solely for missing WordPress at approval/repair.
 */
export function reconcileArticleDraftSchedulingBlocks(input: {
  document: AutopilotPlanItemsDocument;
  approvedAt: Date | null;
}): AutopilotPlanItemsDocument {
  let changed = false;
  let items = input.document.items.map((item) => {
    if (
      item.type === "ARTICLE" &&
      item.status === "blocked" &&
      item.blockedReasonKey === "wordpressNotConnected" &&
      !item.generatedArticleId
    ) {
      changed = true;
      return {
        ...item,
        status: "approved" as const,
        blockedReasonKey: undefined,
      };
    }
    return item;
  });

  if (!changed) {
    return input.document;
  }

  const approvedIds = new Set(
    items
      .filter(
        (item) =>
          item.type === "ARTICLE" &&
          item.status === "approved" &&
          !item.scheduledFor
      )
      .map((item) => item.id)
  );

  if (approvedIds.size > 0) {
    items = assignEveryOtherDaySlots({
      items,
      approvedItemIds: approvedIds,
      now: input.approvedAt ?? new Date(),
    });
  }

  return { ...input.document, items };
}

export function findNextScheduledItem(
  items: AutopilotPlanItem[]
): AutopilotPlanItem | null {
  const now = Date.now();
  const candidates = items
    .filter(
      (item) =>
        item.scheduledFor &&
        ["scheduled", "approved", "prepared"].includes(item.status)
    )
    .map((item) => ({ item, time: new Date(item.scheduledFor!).getTime() }))
    .filter(({ time }) => !Number.isNaN(time) && time >= now - 86_400_000)
    .sort((a, b) => a.time - b.time);

  return candidates[0]?.item ?? null;
}
