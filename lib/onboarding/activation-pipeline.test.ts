/**
 * Run with: npx tsx lib/onboarding/activation-pipeline.test.ts
 */

import assert from "node:assert/strict";

import {
  activationMustNotGenerateArticleDrafts,
  decideAuditStep,
  decideBrandVoiceStep,
  decideMonthlyPlanStep,
  decideSiteTechStep,
  deriveOverallStatus,
  mergeStep,
  normalizeNeedsActionDecision,
  stepsNeedingRetry,
  type ActivationFacts,
} from "./activation-decisions";
import type { ActivationState } from "./activation-types";
import {
  readSiteTechFromBusinessGoals,
  writeSiteTechIntoBusinessGoals,
} from "./site-tech-persist";
import {
  readActivationFromMetadata,
  writeActivationIntoMetadata,
} from "./activation-state-pure";

const baseFacts: ActivationFacts = {
  hasStoredSiteTech: false,
  hasStoredBrandVoice: false,
  brandVoiceManuallyEdited: false,
  hasCompletedAudit: false,
  hasMonthlyPlan: false,
  articleDraftCount: 0,
};

{
  assert.equal(decideSiteTechStep(baseFacts).action, "run");
  assert.equal(
    decideSiteTechStep({ ...baseFacts, hasStoredSiteTech: true }).action,
    "skip"
  );
  // Skip path = activation analytics should not re-fire completed steps.
  assert.equal(
    decideSiteTechStep({ ...baseFacts, hasStoredSiteTech: true }).reason,
    "already_detected"
  );
}

{
  assert.equal(decideBrandVoiceStep(baseFacts).action, "run");
  assert.equal(
    decideBrandVoiceStep({ ...baseFacts, hasStoredBrandVoice: true }).action,
    "skip"
  );
  assert.equal(
    decideBrandVoiceStep({
      ...baseFacts,
      brandVoiceManuallyEdited: true,
      hasStoredBrandVoice: true,
    }).action,
    "skip"
  );
}

{
  assert.equal(decideAuditStep(baseFacts).action, "run");
  assert.equal(
    decideAuditStep({ ...baseFacts, hasCompletedAudit: true }).action,
    "skip"
  );
}

{
  const needsAudit = normalizeNeedsActionDecision(
    decideMonthlyPlanStep(baseFacts)
  );
  assert.equal(needsAudit.action, "skip");
  assert.equal(needsAudit.status, "needs_action");
  assert.equal(needsAudit.reason, "needs_audit");

  assert.equal(
    decideMonthlyPlanStep({ ...baseFacts, hasCompletedAudit: true }).action,
    "run"
  );
  assert.equal(
    decideMonthlyPlanStep({
      ...baseFacts,
      hasCompletedAudit: true,
      hasMonthlyPlan: true,
    }).action,
    "skip"
  );
}

{
  assert.ok(
    activationMustNotGenerateArticleDrafts(baseFacts, 0),
    "activation must not create article drafts"
  );
}

{
  let state: ActivationState | null = null;
  state = mergeStep(state, "site-1", "siteTech", { status: "done" });
  state = mergeStep(state, "site-1", "brandVoice", { status: "done" });
  state = mergeStep(state, "site-1", "audit", { status: "failed" });
  assert.equal(deriveOverallStatus(state.steps), "partial");

  const retryKeys = stepsNeedingRetry(state);
  assert.ok(retryKeys.includes("audit"));
  assert.ok(!retryKeys.includes("siteTech"));
}

{
  // Idempotency: second pass skips completed brand voice / site tech
  const afterFirst: ActivationFacts = {
    ...baseFacts,
    hasStoredSiteTech: true,
    hasStoredBrandVoice: true,
    hasCompletedAudit: true,
    hasMonthlyPlan: true,
  };
  assert.equal(decideSiteTechStep(afterFirst).action, "skip");
  assert.equal(decideBrandVoiceStep(afterFirst).action, "skip");
  assert.equal(decideAuditStep(afterFirst).action, "skip");
  assert.equal(decideMonthlyPlanStep(afterFirst).action, "skip");
}

{
  const detection = {
    platform: "wordpress" as const,
    confidence: 0.9,
    signals: ["wp-content"],
    candidates: [],
    canPublishNatively: true,
    recommendedPublishing: "wordpress" as const,
  };
  const bag = writeSiteTechIntoBusinessGoals({}, detection);
  const roundTrip = readSiteTechFromBusinessGoals(bag);
  assert.equal(roundTrip?.platform, "wordpress");
}

{
  const activation: ActivationState = {
    status: "running",
    version: 1,
    websiteId: "w1",
    steps: { brandVoice: { status: "in_progress" } },
  };
  const meta = writeActivationIntoMetadata({ gscSkipped: true }, activation);
  const read = readActivationFromMetadata(meta);
  assert.equal(read?.websiteId, "w1");
  assert.equal(
    (meta as { gscSkipped: boolean }).gscSkipped,
    true
  );
}

console.log("activation-pipeline decision checks passed");
