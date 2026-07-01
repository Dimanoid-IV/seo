import type { AutopilotPriority } from "./types";

export function scoreToPriority(score: number): AutopilotPriority {
  if (score >= 30) {
    return "HIGH";
  }
  if (score >= 15) {
    return "MEDIUM";
  }
  return "LOW";
}

export const SCORE_WEIGHTS = {
  criticalAuditIssue: 30,
  highPriorityTask: 25,
  gscOpportunity: 20,
  growthScoreDrop: 20,
  integrationError: 20,
  articleReadyForReview: 15,
  socialPostReady: 10,
  noGscConnection: 15,
  noWordPressConnection: 10,
  manyOpenHighPriorityTasks: 25,
  staleAudit: 15,
} as const;
