import { TaskStatus } from "@prisma/client";

import { parsePreparedFix } from "@/lib/tasks/prepared-fix";

import type {
  AutopilotPlanItem,
  AutopilotPlanItemStatus,
} from "./plan-item-types";

export type ReconcileTaskRow = {
  id: string;
  recommendationJson: unknown;
  status?: TaskStatus;
};

const CLOSED_TASK_STATUSES = new Set<TaskStatus>([
  TaskStatus.COMPLETED,
  TaskStatus.DISMISSED,
]);

const PLAN_ITEM_TERMINAL_STATUSES = new Set<AutopilotPlanItemStatus>([
  "executed",
  "published",
  "skipped",
]);

/**
 * Reconciles a single task-linked plan item against live task state.
 *
 * Pure (no DB / server-only imports) so it can be unit tested. Keeps Autopilot,
 * Tasks and Review consistent:
 * - task resolved (completed/dismissed) or missing  → skip (resolvedOrMissingTask)
 * - prepared fix awaiting review                    → prepared + review link
 * - prepared fix approved                           → prepared + review link
 */
export function reconcileTaskLinkedPlanItem(
  item: AutopilotPlanItem,
  taskById: Map<string, ReconcileTaskRow>,
  taskStatusKnown: boolean
): AutopilotPlanItem {
  if (item.sourceRef?.type !== "task") {
    return item;
  }

  const task = taskById.get(item.sourceRef.id);
  const preparedFix = task
    ? parsePreparedFix(
        (task.recommendationJson as Record<string, unknown> | null)?.preparedFix
      )
    : null;

  const taskClosed = task
    ? CLOSED_TASK_STATUSES.has(task.status as TaskStatus)
    : taskStatusKnown;

  const shouldReconcileResolved =
    taskClosed &&
    !preparedFix &&
    !PLAN_ITEM_TERMINAL_STATUSES.has(item.status);

  if (shouldReconcileResolved) {
    return {
      ...item,
      status: "skipped",
      selected: false,
      blockedReasonKey: "resolvedOrMissingTask",
    };
  }

  if (preparedFix?.status === "AWAITING_REVIEW") {
    return {
      ...item,
      status: item.status === "proposed" ? item.status : "prepared",
      reviewQueueHref: "/app/review",
    };
  }

  if (preparedFix?.status === "APPROVED") {
    return {
      ...item,
      status: ["published", "executed"].includes(item.status)
        ? item.status
        : "prepared",
      reviewQueueHref: "/app/review",
    };
  }

  return item;
}
