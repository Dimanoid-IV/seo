/**
 * Deterministic checks for autopilot plan item link on article approval.
 * Run with: npx tsx lib/autopilot/link-article-approval.test.ts
 */
import assert from "node:assert/strict";

import {
  applyArticleApprovalToPlanItem,
  updatePlanItemsForArticleApproval,
} from "./link-article-approval";
import type { AutopilotPlanItem, AutopilotPlanItemsDocument } from "./plan-item-types";

function baseDocument(
  items: AutopilotPlanItem[]
): AutopilotPlanItemsDocument {
  return {
    version: 1,
    period: "monthly",
    items,
  };
}

function baseArticleItem(
  overrides: Partial<AutopilotPlanItem> = {}
): AutopilotPlanItem {
  return {
    id: "item-1",
    type: "ARTICLE",
    title: "Test article",
    reason: "Grow traffic",
    riskLevel: "low",
    needsIntegration: true,
    integrationType: "wordpress",
    status: "prepared",
    scheduledFor: "2026-07-15T10:00:00.000Z",
    generatedArticleId: "article-1",
    articleQualityScore: 85,
    articleQualityPassed: true,
    blockedReasonKey: "articleNeedsRevision",
    ...overrides,
  };
}

function runLinkArticleApprovalChecks(): void {
  const approvedAt = "2026-07-11T12:00:00.000Z";

  const single = applyArticleApprovalToPlanItem(
    baseArticleItem(),
    approvedAt
  );
  assert.equal(single.linkedArticleApprovedAt, approvedAt);
  assert.equal(single.blockedReasonKey, undefined);
  assert.equal(single.scheduledFor, "2026-07-15T10:00:00.000Z");
  assert.equal(single.status, "prepared");

  const wpBlock = applyArticleApprovalToPlanItem(
    baseArticleItem({ blockedReasonKey: "wordpressNotConnected", status: "blocked" }),
    approvedAt
  );
  assert.equal(wpBlock.blockedReasonKey, "wordpressNotConnected");
  assert.equal(wpBlock.linkedArticleApprovedAt, approvedAt);

  const document = baseDocument([
    baseArticleItem({ id: "item-1" }),
    baseArticleItem({
      id: "item-2",
      generatedArticleId: "article-2",
    }),
    baseArticleItem({
      id: "item-3",
      generatedArticleId: "article-1",
      scheduledFor: "2026-07-20T10:00:00.000Z",
    }),
  ]);

  const result = updatePlanItemsForArticleApproval(
    document,
    "article-1",
    approvedAt
  );

  assert.deepEqual(result.matchedItemIds, ["item-1", "item-3"]);
  assert.equal(
    result.document.items[0]!.linkedArticleApprovedAt,
    approvedAt
  );
  assert.equal(
    result.document.items[2]!.scheduledFor,
    "2026-07-20T10:00:00.000Z"
  );
  assert.equal(result.document.items[1]!.linkedArticleApprovedAt, undefined);
}

if (require.main === module) {
  runLinkArticleApprovalChecks();
  console.log("link-article-approval checks passed");
}

export { runLinkArticleApprovalChecks };
