import assert from "node:assert/strict";

import { mapRecommendedActionTypeToPlanItemType } from "./plan-item-types";

assert.equal(mapRecommendedActionTypeToPlanItemType("REVIEW"), "SEO_FIX");
assert.equal(mapRecommendedActionTypeToPlanItemType("TASK"), "TASK_FIX");
assert.equal(mapRecommendedActionTypeToPlanItemType("INTEGRATION"), "SEO_FIX");
assert.equal(mapRecommendedActionTypeToPlanItemType("ARTICLE"), "ARTICLE");
assert.equal(mapRecommendedActionTypeToPlanItemType("SOCIAL_POST"), "SOCIAL_POST");

console.log("autopilot plan item mapping guardrails passed");
