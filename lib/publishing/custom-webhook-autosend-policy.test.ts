/**
 * Run with: npx tsx lib/publishing/custom-webhook-autosend-policy.test.ts
 */

import assert from "node:assert/strict";

import { AutopilotMode } from "@prisma/client";

import { canEnableCustomWebhookAutoSend } from "./custom-webhook-autosend-policy";

assert.equal(
  canEnableCustomWebhookAutoSend({
    hasApprovedAutoPublishPlan: true,
    autopilotMode: AutopilotMode.AUTOPUBLISH,
  }),
  true
);

assert.equal(
  canEnableCustomWebhookAutoSend({
    hasApprovedAutoPublishPlan: false,
    autopilotMode: AutopilotMode.AUTOPUBLISH,
  }),
  false
);

assert.equal(
  canEnableCustomWebhookAutoSend({
    hasApprovedAutoPublishPlan: true,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
  }),
  false
);

assert.equal(
  canEnableCustomWebhookAutoSend({
    hasApprovedAutoPublishPlan: true,
    autopilotMode: AutopilotMode.REVIEW_FIRST,
  }),
  false
);

assert.equal(
  canEnableCustomWebhookAutoSend({
    hasApprovedAutoPublishPlan: true,
    autopilotMode: AutopilotMode.OFF,
  }),
  false
);

console.log("custom-webhook-autosend-policy.test.ts: ok");
