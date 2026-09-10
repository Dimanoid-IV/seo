import assert from "node:assert/strict";
import { activationNeedsRecovery, prepareActivationAttempt } from "./activation-recovery";
import type { ActivationState } from "./activation-types";

const now = new Date("2026-09-09T12:00:00Z");
const state: ActivationState = {
  version: 1, websiteId: "site", status: "running",
  startedAt: "2026-09-09T11:40:00Z",
  steps: { audit: { status: "done", updatedAt: "2026-09-09T11:41:00Z", resultRef: "audit" }, monthlyPlan: { status: "in_progress", updatedAt: "2026-09-09T11:42:00Z" } },
};
assert.equal(activationNeedsRecovery(state, now), true, "a killed worker must be recoverable");
assert.equal(activationNeedsRecovery({ ...state, steps: { ...state.steps, monthlyPlan: { status: "in_progress", updatedAt: now.toISOString() } } }, now), false, "do not restart an active worker");
assert.equal(activationNeedsRecovery({ ...state, status: "done" }, now), false);
assert.equal(activationNeedsRecovery({ ...state, status: "failed", finishedAt: now.toISOString() }, now), false, "failures must back off");
assert.equal(activationNeedsRecovery({ ...state, status: "failed", finishedAt: state.startedAt }, now), true);
const resumed = prepareActivationAttempt(state, "site", now);
assert.deepEqual(resumed.steps.audit, state.steps.audit, "retries preserve completed work");
assert.equal(resumed.startedAt, now.toISOString());
assert.equal(resumed.status, "running");
assert.deepEqual(prepareActivationAttempt(state, "other-site", now).steps, {}, "never reuse another website's progress");
console.log("activation recovery tests passed");
