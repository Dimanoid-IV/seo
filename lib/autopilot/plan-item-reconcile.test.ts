/**
 * Deterministic checks for task-linked plan item reconciliation.
 * Run with: npx tsx lib/autopilot/plan-item-reconcile.test.ts
 */
import assert from "node:assert/strict";

import { TaskStatus } from "@prisma/client";

import {
  reconcileTaskLinkedPlanItem,
  type ReconcileTaskRow,
} from "./plan-item-reconcile";
import type { AutopilotPlanItem } from "./plan-item-types";

function taskFixItem(
  overrides: Partial<AutopilotPlanItem> = {}
): AutopilotPlanItem {
  return {
    id: "item-1",
    type: "TASK_FIX",
    title: "На странице слишком мало текста",
    reason: "Thin content task from audit.",
    riskLevel: "medium",
    needsIntegration: false,
    integrationType: "manual",
    status: "approved",
    selected: true,
    sourceRef: { type: "task", id: "task-1" },
    reviewQueueHref: "/app/review",
    ...overrides,
  };
}

function mapOf(rows: ReconcileTaskRow[]): Map<string, ReconcileTaskRow> {
  return new Map(rows.map((r) => [r.id, r]));
}

function run(): void {
  const preparedFixJson = (status: string) => ({
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
  });

  // 1. Completed task with no prepared fix → skipped (resolvedOrMissingTask).
  const completed = reconcileTaskLinkedPlanItem(
    taskFixItem(),
    mapOf([{ id: "task-1", recommendationJson: {}, status: TaskStatus.COMPLETED }]),
    true
  );
  assert.equal(completed.status, "skipped");
  assert.equal(completed.selected, false);
  assert.equal(completed.blockedReasonKey, "resolvedOrMissingTask");

  // 2. Dismissed task → skipped.
  const dismissed = reconcileTaskLinkedPlanItem(
    taskFixItem(),
    mapOf([{ id: "task-1", recommendationJson: {}, status: TaskStatus.DISMISSED }]),
    true
  );
  assert.equal(dismissed.status, "skipped");
  assert.equal(dismissed.blockedReasonKey, "resolvedOrMissingTask");

  // 3. Missing task (known status set elsewhere) → skipped.
  const missing = reconcileTaskLinkedPlanItem(taskFixItem(), mapOf([]), true);
  assert.equal(missing.status, "skipped");
  assert.equal(missing.blockedReasonKey, "resolvedOrMissingTask");

  // 4. Missing task but status unknown (partial select) → left unchanged (safe).
  const missingUnknown = reconcileTaskLinkedPlanItem(
    taskFixItem(),
    mapOf([]),
    false
  );
  assert.equal(missingUnknown.status, "approved");
  assert.equal(missingUnknown.blockedReasonKey, undefined);

  // 5. Open task → left unchanged.
  const open = reconcileTaskLinkedPlanItem(
    taskFixItem(),
    mapOf([{ id: "task-1", recommendationJson: {}, status: TaskStatus.OPEN }]),
    true
  );
  assert.equal(open.status, "approved");

  // 6. Prepared fix AWAITING_REVIEW on a completed task → surfaces in review, not skipped.
  const awaiting = reconcileTaskLinkedPlanItem(
    taskFixItem({ status: "approved" }),
    mapOf([
      {
        id: "task-1",
        recommendationJson: preparedFixJson("AWAITING_REVIEW"),
        status: TaskStatus.COMPLETED,
      },
    ]),
    true
  );
  assert.equal(awaiting.status, "prepared");
  assert.equal(awaiting.reviewQueueHref, "/app/review");

  // 7. Already-executed item is never downgraded to skipped.
  const executed = reconcileTaskLinkedPlanItem(
    taskFixItem({ status: "executed" }),
    mapOf([{ id: "task-1", recommendationJson: {}, status: TaskStatus.COMPLETED }]),
    true
  );
  assert.equal(executed.status, "executed");

  // 8. Non-task items are untouched.
  const article = reconcileTaskLinkedPlanItem(
    taskFixItem({ type: "ARTICLE", sourceRef: { type: "article", id: "a-1" } }),
    mapOf([]),
    true
  );
  assert.equal(article.status, "approved");
}

if (require.main === module) {
  run();
  console.log("plan-item-reconcile checks passed");
}

export { run as runPlanItemReconcileChecks };
