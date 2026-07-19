/**
 * Pure activation decisions — unit-testable without DB/Hermes.
 */

import type {
  ActivationOverallStatus,
  ActivationState,
  ActivationStepKey,
  ActivationStepState,
  ActivationStepStatus,
} from "./activation-types";

export type ActivationFacts = {
  hasStoredSiteTech: boolean;
  hasStoredBrandVoice: boolean;
  brandVoiceManuallyEdited: boolean;
  hasCompletedAudit: boolean;
  hasMonthlyPlan: boolean;
  articleDraftCount: number;
};

export type StepDecision =
  | { action: "skip"; reason: string; status: "skipped" | "done" }
  | { action: "run" }
  | { action: "retry" };

export function decideSiteTechStep(facts: ActivationFacts): StepDecision {
  if (facts.hasStoredSiteTech) {
    return { action: "skip", reason: "already_detected", status: "done" };
  }
  return { action: "run" };
}

export function decideBrandVoiceStep(facts: ActivationFacts): StepDecision {
  if (facts.brandVoiceManuallyEdited || facts.hasStoredBrandVoice) {
    return { action: "skip", reason: "already_extracted", status: "done" };
  }
  return { action: "run" };
}

export function decideAuditStep(facts: ActivationFacts): StepDecision {
  if (facts.hasCompletedAudit) {
    return { action: "skip", reason: "audit_exists", status: "done" };
  }
  return { action: "run" };
}

export function decideMonthlyPlanStep(facts: ActivationFacts): StepDecision {
  if (facts.hasMonthlyPlan) {
    return { action: "skip", reason: "plan_exists", status: "done" };
  }
  if (!facts.hasCompletedAudit) {
    return { action: "skip", reason: "needs_audit", status: "skipped" };
  }
  return { action: "run" };
}

/**
 * First activation must never create article drafts.
 */
export function activationMustNotGenerateArticleDrafts(
  facts: ActivationFacts,
  draftsCreatedByPipeline: number
): boolean {
  return draftsCreatedByPipeline === 0 && facts.articleDraftCount >= 0;
}

export function mergeStep(
  current: ActivationState | null,
  websiteId: string,
  key: ActivationStepKey,
  step: ActivationStepState
): ActivationState {
  const base: ActivationState = current ?? {
    status: "running",
    version: 1,
    websiteId,
    steps: {},
  };

  return {
    ...base,
    websiteId,
    steps: {
      ...base.steps,
      [key]: {
        ...base.steps[key],
        ...step,
        updatedAt: step.updatedAt ?? new Date().toISOString(),
      },
    },
  };
}

export function deriveOverallStatus(
  steps: Partial<Record<ActivationStepKey, ActivationStepState>>
): ActivationOverallStatus {
  const values = Object.values(steps);
  if (values.length === 0) return "idle";

  if (values.some((s) => s.status === "in_progress")) return "running";

  const failed = values.filter((s) => s.status === "failed");
  const needs = values.filter((s) => s.status === "needs_action");
  const doneish = values.filter(
    (s) => s.status === "done" || s.status === "skipped"
  );

  if (failed.length > 0 && doneish.length > 0) return "partial";
  if (failed.length > 0 && doneish.length === 0) return "failed";
  if (needs.length > 0 && doneish.length > 0) return "partial";
  if (needs.length > 0) return "partial";
  if (
    values.every((s) => s.status === "done" || s.status === "skipped")
  ) {
    return "done";
  }
  return "running";
}

export function stepsNeedingRetry(
  state: ActivationState | null
): ActivationStepKey[] {
  if (!state) return [];
  const keys: ActivationStepKey[] = [
    "siteTech",
    "brandVoice",
    "audit",
    "growth",
    "topics",
    "monthlyPlan",
  ];
  return keys.filter((key) => {
    const status = state.steps[key]?.status;
    return status === "failed" || status === "needs_action" || status === "pending";
  });
}

export function normalizeNeedsActionDecision(
  decision: StepDecision
): { action: "run" | "skip"; reason?: string; status?: ActivationStepStatus } {
  if (decision.action === "run" || decision.action === "retry") {
    return { action: "run" };
  }
  if (decision.reason === "needs_audit") {
    return { action: "skip", reason: decision.reason, status: "needs_action" };
  }
  return { action: "skip", reason: decision.reason, status: decision.status };
}
