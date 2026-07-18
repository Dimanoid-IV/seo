import assert from "node:assert/strict";

import {
  assignPipelineScheduleDates,
  deriveArticlePipelineState,
  resolvePublishingPath,
} from "./article-pipeline";
import type { AutopilotPlanItem } from "./plan-item-types";
import { assignEveryOtherDaySlots } from "./scheduling";

function articleItem(
  overrides: Partial<AutopilotPlanItem> = {}
): AutopilotPlanItem {
  return {
    id: "a1",
    type: "ARTICLE",
    title: "Topic",
    reason: "Growth",
    riskLevel: "low",
    needsIntegration: false,
    integrationType: "manual",
    status: "proposed",
    ...overrides,
  };
}

// Every-other-day scheduling for approved articles.
const scheduled = assignEveryOtherDaySlots({
  items: [articleItem({ id: "a" }), articleItem({ id: "b" })],
  approvedItemIds: new Set(["a", "b"]),
  now: new Date("2026-07-15T12:00:00.000Z"),
});
assert.equal(scheduled.length, 2);
assert.ok(scheduled[0]?.scheduledFor);
assert.ok(scheduled[1]?.scheduledFor);
assert.notEqual(scheduled[0]?.scheduledFor, scheduled[1]?.scheduledFor);
assert.equal(scheduled[0]?.pipelineState, "SCHEDULED_FOR_RESEARCH");
assert.ok(scheduled[0]?.plannedResearchAt);
assert.ok(scheduled[0]?.plannedDraftAt);
assert.ok(scheduled[0]?.plannedPublishAt);

// Publishing path resolution.
assert.equal(
  resolvePublishingPath({
    wordpressConnected: true,
    webhookConfiguredAndTested: true,
  }),
  "wordpress_draft"
);
assert.equal(
  resolvePublishingPath({
    wordpressConnected: false,
    webhookConfiguredAndTested: true,
  }),
  "webhook"
);
assert.equal(
  resolvePublishingPath({
    wordpressConnected: false,
    webhookConfiguredAndTested: false,
  }),
  "universal_package"
);

// Pipeline derivation.
assert.equal(
  deriveArticlePipelineState(articleItem({ status: "proposed" })),
  "PROPOSED_TOPIC"
);
assert.equal(
  deriveArticlePipelineState(
    articleItem({
      status: "prepared",
      generatedArticleId: "art-1",
      articleQualityPassed: false,
    }),
    { qualityPassed: false }
  ),
  "QUALITY_FAILED_NEEDS_REPAIR"
);
assert.equal(
  deriveArticlePipelineState(
    articleItem({
      status: "prepared",
      generatedArticleId: "art-1",
      articleQualityPassed: true,
      universalPackagePreparedAt: "2026-07-16T10:00:00.000Z",
      pipelineState: "UNIVERSAL_PACKAGE_READY",
    }),
    { qualityPassed: true }
  ),
  "UNIVERSAL_PACKAGE_READY"
);

const dates = assignPipelineScheduleDates(
  articleItem(),
  "2026-07-20T09:00:00.000Z"
);
assert.equal(dates.plannedDraftAt, "2026-07-20T09:00:00.000Z");
assert.ok(dates.plannedPublishAt);
assert.notEqual(dates.plannedPublishAt, dates.plannedDraftAt);

console.log("article-pipeline checks passed");
