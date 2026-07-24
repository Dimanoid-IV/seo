/**
 * Run with: npx tsx lib/autopilot/autopilot-status.test.ts
 */
import assert from "node:assert/strict";

import {
  hasArticleAwaitingPublishingIntegration,
  publishingIntegrationReady,
} from "./autopilot-status";
import type { AutopilotPlanItem } from "./plan-item-types";

function article(overrides: Partial<AutopilotPlanItem> = {}): AutopilotPlanItem {
  return {
    id: "article-1",
    type: "ARTICLE",
    title: "Ready article",
    reason: "Scheduled growth article",
    riskLevel: "low",
    needsIntegration: false,
    integrationType: "manual",
    status: "prepared",
    generatedArticleId: "article-id",
    articleQualityPassed: true,
    ...overrides,
  };
}

assert.equal(hasArticleAwaitingPublishingIntegration([article()]), true);
assert.equal(
  hasArticleAwaitingPublishingIntegration([
    article({ status: "executed" }),
    article({ status: "published" }),
    article({ status: "skipped" }),
  ]),
  false
);
assert.equal(
  hasArticleAwaitingPublishingIntegration([
    article({ generatedArticleId: undefined }),
    article({ articleQualityPassed: false }),
  ]),
  false
);

assert.equal(
  publishingIntegrationReady({
    wordpressConnected: false,
    customPublishingConnected: false,
  }),
  false
);
assert.equal(
  publishingIntegrationReady({
    wordpressConnected: true,
    customPublishingConnected: false,
  }),
  true
);
assert.equal(
  publishingIntegrationReady({
    wordpressConnected: false,
    customPublishingConnected: true,
  }),
  true
);

console.log("autopilot-status.test.ts: ok");
