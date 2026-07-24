import assert from "node:assert/strict";

import {
  parsePlanItemsDocument,
  planItemsToJson,
} from "./plan-items";
import type { AutopilotPlanItemsDocument } from "./plan-item-types";

const document: AutopilotPlanItemsDocument = {
  version: 1,
  period: "monthly",
  items: [
    {
      id: "item-1",
      type: "ARTICLE",
      title: "Ready article",
      reason: "Content opportunity",
      riskLevel: "low",
      needsIntegration: false,
      integrationType: "none",
      status: "executed",
      generatedArticleId: "article-1",
      articleQualityPassed: true,
      pipelineState: "WEBHOOK_SENT",
      publishingPath: "webhook",
      webhookReadyAt: "2026-07-24T10:00:00.000Z",
      webhookSentAt: "2026-07-24T10:01:00.000Z",
      nextAutomatedStep: "done",
      plannedResearchAt: "2026-07-20T06:00:00.000Z",
      plannedDraftAt: "2026-07-21T06:00:00.000Z",
      plannedPublishAt: "2026-07-22T06:00:00.000Z",
      reviewQueueHref: "/app/review",
    },
  ],
};

const parsed = parsePlanItemsDocument(planItemsToJson(document));
assert.ok(parsed);
assert.equal(parsed.items[0]?.pipelineState, "WEBHOOK_SENT");
assert.equal(parsed.items[0]?.publishingPath, "webhook");
assert.equal(parsed.items[0]?.webhookSentAt, "2026-07-24T10:01:00.000Z");
assert.equal(parsed.items[0]?.plannedPublishAt, "2026-07-22T06:00:00.000Z");
assert.equal(parsed.items[0]?.nextAutomatedStep, "done");

console.log("plan item publication parser test passed");
