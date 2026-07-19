/**
 * First-website activation pipeline status (stored in OnboardingState.metadata).
 * Prompt 11.46 — hands-off setup after website add.
 */

export type ActivationStepStatus =
  | "pending"
  | "in_progress"
  | "done"
  | "skipped"
  | "needs_action"
  | "failed";

export type ActivationOverallStatus =
  | "idle"
  | "running"
  | "done"
  | "partial"
  | "failed";

export type ActivationStepKey =
  | "siteTech"
  | "brandVoice"
  | "audit"
  | "growth"
  | "topics"
  | "monthlyPlan";

export type ActivationStepState = {
  status: ActivationStepStatus;
  updatedAt?: string;
  detail?: string;
  error?: string;
  /** Platform label for site tech, plan id, audit id, etc. */
  resultRef?: string;
};

export type ActivationState = {
  status: ActivationOverallStatus;
  version: 1;
  websiteId: string;
  startedAt?: string;
  finishedAt?: string;
  steps: Partial<Record<ActivationStepKey, ActivationStepState>>;
  /** Honest reason when monthly plan topics were not prepared */
  planBlockedReason?: string;
  lastError?: string;
};

export const ACTIVATION_METADATA_KEY = "activation" as const;
export const SITE_TECH_BUSINESS_GOALS_KEY = "siteTech" as const;

export const ACTIVATION_STEP_ORDER: ActivationStepKey[] = [
  "siteTech",
  "brandVoice",
  "audit",
  "growth",
  "topics",
  "monthlyPlan",
];
