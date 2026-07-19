/**
 * Run with: npx tsx lib/autopilot/plan-publishing-mode.test.ts
 */

import assert from "node:assert/strict";

import {
  defaultPlanPublishingMode,
  isApprovedPlanArticleLivePublishPermitted,
  isPlanAutoPublishMode,
  parsePlanPublishingMode,
} from "./plan-publishing-mode";

assert.equal(defaultPlanPublishingMode(), "REVIEW_ONLY");
assert.equal(parsePlanPublishingMode(undefined), "REVIEW_ONLY");
assert.equal(parsePlanPublishingMode("garbage"), "REVIEW_ONLY");
assert.equal(parsePlanPublishingMode("AUTO_PUBLISH"), "AUTO_PUBLISH");
assert.equal(isPlanAutoPublishMode("AUTO_PUBLISH"), true);
assert.equal(isPlanAutoPublishMode("REVIEW_ONLY"), false);

assert.equal(
  isApprovedPlanArticleLivePublishPermitted({
    planStatus: "APPROVED",
    publishingMode: "AUTO_PUBLISH",
    qualityPassed: true,
  }),
  true
);

assert.equal(
  isApprovedPlanArticleLivePublishPermitted({
    planStatus: "APPROVED",
    publishingMode: "REVIEW_ONLY",
    qualityPassed: true,
  }),
  false,
  "REVIEW_ONLY must not grant live publish"
);

assert.equal(
  isApprovedPlanArticleLivePublishPermitted({
    planStatus: "DRAFT",
    publishingMode: "AUTO_PUBLISH",
    qualityPassed: true,
  }),
  false,
  "unapproved plan must not grant live publish"
);

assert.equal(
  isApprovedPlanArticleLivePublishPermitted({
    planStatus: "APPROVED",
    publishingMode: "AUTO_PUBLISH",
    qualityPassed: false,
  }),
  false,
  "failed quality must not grant live publish"
);

console.log("plan-publishing-mode.test.ts: ok");
