import { TaskStatus } from "@prisma/client";

import { parsePreparedFix } from "@/lib/tasks/prepared-fix";

import type { MonthlyAutopilotMetrics } from "./types";

export type ReconcileMetricsTaskRow = {
  status: TaskStatus;
  recommendationJson: unknown;
};

export type LiveTaskCounts = {
  /** Active tasks shown in /app/tasks (OPEN + IN_PROGRESS). */
  openTasksCount: number;
  /** Tasks that surface in /app/review (WAITING_REVIEW + AWAITING_REVIEW fix). */
  reviewableTasksCount: number;
  /** Terminal completed tasks. */
  completedTasksCount: number;
};

function preparedFixStatus(recommendationJson: unknown): string | null {
  const preparedFix = parsePreparedFix(
    (recommendationJson as Record<string, unknown> | null)?.preparedFix
  );
  return preparedFix?.status ?? null;
}

/**
 * Derives current task counts straight from live task rows using the exact same
 * visibility rules as /app/tasks and /app/review:
 *
 * - OPEN / IN_PROGRESS      → open (visible in /app/tasks)
 * - WAITING_REVIEW          → reviewable ONLY when its prepared fix is
 *                             AWAITING_REVIEW (so it actually shows in /app/review);
 *                             an APPROVED/REJECTED/absent fix is neither open nor
 *                             reviewable (it is effectively resolved)
 * - COMPLETED               → completed
 * - DISMISSED / FAILED      → neither open nor reviewable
 *
 * This keeps the Autopilot metrics grid from ever showing phantom open tasks
 * caused by a stale metricsJson snapshot.
 */
export function computeLiveTaskCounts(
  tasks: ReconcileMetricsTaskRow[]
): LiveTaskCounts {
  let openTasksCount = 0;
  let reviewableTasksCount = 0;
  let completedTasksCount = 0;

  for (const task of tasks) {
    if (
      task.status === TaskStatus.OPEN ||
      task.status === TaskStatus.IN_PROGRESS
    ) {
      openTasksCount += 1;
      continue;
    }

    if (task.status === TaskStatus.WAITING_REVIEW) {
      if (preparedFixStatus(task.recommendationJson) === "AWAITING_REVIEW") {
        reviewableTasksCount += 1;
      }
      continue;
    }

    if (task.status === TaskStatus.COMPLETED) {
      completedTasksCount += 1;
    }
  }

  return { openTasksCount, reviewableTasksCount, completedTasksCount };
}

/**
 * Returns a view-model copy of the plan metrics with `openTasksCount` and
 * `completedTasksCount` replaced by live values. All other counts stay as the
 * historical snapshot (they do not create dead-ends). Pure — no DB access — so
 * it can be unit tested and reused by any current-plan surface.
 */
export function reconcileMonthlyPlanMetrics(
  metrics: MonthlyAutopilotMetrics,
  tasks: ReconcileMetricsTaskRow[]
): MonthlyAutopilotMetrics {
  const live = computeLiveTaskCounts(tasks);
  return {
    ...metrics,
    openTasksCount: live.openTasksCount,
    completedTasksCount: live.completedTasksCount,
  };
}
