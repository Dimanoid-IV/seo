import assert from "node:assert/strict";

import {
  isUserVisiblePlanItem,
  mapRecommendedActionTypeToPlanItemType,
  type AutopilotPlanItem,
} from "./plan-item-types";

assert.equal(mapRecommendedActionTypeToPlanItemType("REVIEW"), "SEO_FIX");
assert.equal(mapRecommendedActionTypeToPlanItemType("TASK"), "TASK_FIX");
assert.equal(mapRecommendedActionTypeToPlanItemType("INTEGRATION"), "SEO_FIX");
assert.equal(mapRecommendedActionTypeToPlanItemType("ARTICLE"), "ARTICLE");
assert.equal(mapRecommendedActionTypeToPlanItemType("SOCIAL_POST"), "SOCIAL_POST");

const baseItem: AutopilotPlanItem = {
  id: "item-1",
  type: "SEO_FIX",
  title: "Connect Google Search Console",
  reason: "Navigation-style legacy recommendation",
  riskLevel: "medium",
  needsIntegration: false,
  integrationType: "manual",
  status: "approved",
};

assert.equal(isUserVisiblePlanItem(baseItem), false);
assert.equal(
  isUserVisiblePlanItem({
    ...baseItem,
    sourceRef: { type: "task", id: "task-1" },
  }),
  true
);
assert.equal(
  isUserVisiblePlanItem({
    ...baseItem,
    status: "proposed",
  }),
  true
);
assert.equal(
  isUserVisiblePlanItem({
    ...baseItem,
    type: "ARTICLE",
  }),
  true
);

console.log("autopilot plan item mapping guardrails passed");
