/**
 * Plan-scoped publishing mode helpers (Prompt 11.50).
 * AUTO_PUBLISH is never the silent default.
 */

export const PlanPublishingModeValue = {
  REVIEW_ONLY: "REVIEW_ONLY",
  AUTO_PUBLISH: "AUTO_PUBLISH",
} as const;

export type PlanPublishingModeValue =
  (typeof PlanPublishingModeValue)[keyof typeof PlanPublishingModeValue];

export function parsePlanPublishingMode(
  value: unknown
): PlanPublishingModeValue {
  if (value === "AUTO_PUBLISH" || value === "auto_publish") {
    return PlanPublishingModeValue.AUTO_PUBLISH;
  }
  return PlanPublishingModeValue.REVIEW_ONLY;
}

/** Default for new sites / new plans — never AUTO_PUBLISH. */
export function defaultPlanPublishingMode(): PlanPublishingModeValue {
  return PlanPublishingModeValue.REVIEW_ONLY;
}

export function isPlanAutoPublishMode(
  mode: PlanPublishingModeValue | string | null | undefined
): boolean {
  return mode === PlanPublishingModeValue.AUTO_PUBLISH;
}

/**
 * Live-publish permission for an article inside an approved plan.
 * Does not bypass the global kill switch / rollback prerequisites.
 */
export function isApprovedPlanArticleLivePublishPermitted(input: {
  planStatus: string;
  publishingMode: PlanPublishingModeValue | string | null | undefined;
  qualityPassed: boolean | null | undefined;
}): boolean {
  const status = input.planStatus.toUpperCase();
  if (status !== "APPROVED") return false;
  if (!isPlanAutoPublishMode(input.publishingMode)) return false;
  return input.qualityPassed === true;
}
