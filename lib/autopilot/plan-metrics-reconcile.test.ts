/**
 * Deterministic checks for live-derived monthly plan metrics.
 * Run with: npx tsx lib/autopilot/plan-metrics-reconcile.test.ts
 */
import assert from "node:assert/strict";

import { TaskStatus } from "@prisma/client";

import {
  computeLiveTaskCounts,
  reconcileMonthlyPlanMetrics,
  type ReconcileMetricsTaskRow,
} from "./plan-metrics-reconcile";
import type { MonthlyAutopilotMetrics } from "./types";

function preparedFixJson(status: string) {
  return {
    preparedFix: {
      id: "fix-1",
      type: "TASK_FIX",
      status,
      title: "Prepared thin content fix",
      preview: "Add more descriptive copy to the page.",
      suggestedValue: "Longer, descriptive page copy...",
      summary: "summary",
      generatedBy: "HERMES",
      createdAt: "2026-07-10T10:00:00.000Z",
      updatedAt: "2026-07-10T10:00:00.000Z",
    },
  };
}

function staleMetrics(
  overrides: Partial<MonthlyAutopilotMetrics> = {}
): MonthlyAutopilotMetrics {
  return {
    growthScore: 88,
    growthScoreDelta: 2,
    openTasksCount: 2,
    completedTasksCount: 0,
    opportunitiesCount: 5,
    warningsCount: 1,
    draftArticlesCount: 3,
    readySocialPostsCount: 2,
    ...overrides,
  };
}

function run(): void {
  // 1. Stale snapshot says 2 open, but DB has no active tasks → view model shows 0.
  //    (popart.ee production scenario: 2 WAITING_REVIEW tasks w/ APPROVED fixes.)
  const popartTasks: ReconcileMetricsTaskRow[] = [
    {
      status: TaskStatus.WAITING_REVIEW,
      recommendationJson: preparedFixJson("APPROVED"),
    },
    {
      status: TaskStatus.WAITING_REVIEW,
      recommendationJson: preparedFixJson("APPROVED"),
    },
  ];
  const reconciled = reconcileMonthlyPlanMetrics(staleMetrics(), popartTasks);
  assert.equal(reconciled.openTasksCount, 0);
  // Snapshot-only counts are preserved.
  assert.equal(reconciled.opportunitiesCount, 5);
  assert.equal(reconciled.draftArticlesCount, 3);

  // 2. OPEN / IN_PROGRESS count as open.
  const active = computeLiveTaskCounts([
    { status: TaskStatus.OPEN, recommendationJson: {} },
    { status: TaskStatus.IN_PROGRESS, recommendationJson: {} },
  ]);
  assert.equal(active.openTasksCount, 2);
  assert.equal(active.reviewableTasksCount, 0);

  // 3. COMPLETED / DISMISSED / FAILED do not count as open.
  const closed = computeLiveTaskCounts([
    { status: TaskStatus.COMPLETED, recommendationJson: {} },
    { status: TaskStatus.DISMISSED, recommendationJson: {} },
    { status: TaskStatus.FAILED, recommendationJson: {} },
  ]);
  assert.equal(closed.openTasksCount, 0);
  assert.equal(closed.completedTasksCount, 1);

  // 4. WAITING_REVIEW + preparedFix APPROVED does not count as open or reviewable.
  const approvedFix = computeLiveTaskCounts([
    {
      status: TaskStatus.WAITING_REVIEW,
      recommendationJson: preparedFixJson("APPROVED"),
    },
  ]);
  assert.equal(approvedFix.openTasksCount, 0);
  assert.equal(approvedFix.reviewableTasksCount, 0);

  // 5. WAITING_REVIEW + preparedFix AWAITING_REVIEW → reviewable (surfaces in
  //    /app/review), still not counted as open.
  const awaitingFix = computeLiveTaskCounts([
    {
      status: TaskStatus.WAITING_REVIEW,
      recommendationJson: preparedFixJson("AWAITING_REVIEW"),
    },
  ]);
  assert.equal(awaitingFix.openTasksCount, 0);
  assert.equal(awaitingFix.reviewableTasksCount, 1);

  // 6. WAITING_REVIEW with no prepared fix → neither open nor reviewable.
  const noFix = computeLiveTaskCounts([
    { status: TaskStatus.WAITING_REVIEW, recommendationJson: {} },
  ]);
  assert.equal(noFix.openTasksCount, 0);
  assert.equal(noFix.reviewableTasksCount, 0);

  // 7. Mixed set aggregates correctly.
  const mixed = computeLiveTaskCounts([
    { status: TaskStatus.OPEN, recommendationJson: {} },
    { status: TaskStatus.IN_PROGRESS, recommendationJson: {} },
    { status: TaskStatus.COMPLETED, recommendationJson: {} },
    {
      status: TaskStatus.WAITING_REVIEW,
      recommendationJson: preparedFixJson("AWAITING_REVIEW"),
    },
  ]);
  assert.equal(mixed.openTasksCount, 2);
  assert.equal(mixed.completedTasksCount, 1);
  assert.equal(mixed.reviewableTasksCount, 1);

  // 8. Empty task list → all zero.
  const empty = computeLiveTaskCounts([]);
  assert.equal(empty.openTasksCount, 0);
  assert.equal(empty.completedTasksCount, 0);
  assert.equal(empty.reviewableTasksCount, 0);
}

if (require.main === module) {
  run();
  console.log("plan-metrics-reconcile checks passed");
}

export { run as runPlanMetricsReconcileChecks };
