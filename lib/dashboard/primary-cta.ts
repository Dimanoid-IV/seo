/**
 * Sales-polish primary CTA for the simple dashboard (Prompt 11.42).
 * Explicit priority — email/report never win as the main "what to do now".
 */

export type DashboardPrimaryCtaKind =
  | "RUN_AUDIT"
  | "OPEN_REVIEW"
  | "OPEN_PLAN"
  | "SELECT_GSC"
  | "SETUP_PUBLISHING"
  | "OPEN_CONTROL_CENTER";

export type DashboardPrimaryCtaInput = {
  hasAudit: boolean;
  reviewQueueCount: number;
  hasApprovedPlanWithArticleTopics: boolean;
  gscNeedsProperty: boolean;
  publishingConfigured: boolean;
};

export type DashboardPrimaryCtaDecision = {
  kind: DashboardPrimaryCtaKind;
  href: string;
  apiAction?: string;
};

/**
 * Pure priority resolver. First match wins.
 * 1. No audit → check site
 * 2. Review queue has items → open review
 * 3. Approved plan with article topics → open plan
 * 4. GSC property missing → select site
 * 5. Publishing not configured → setup publishing
 * 6. Else → control center
 */
export function resolveDashboardPrimaryCta(
  input: DashboardPrimaryCtaInput
): DashboardPrimaryCtaDecision {
  if (!input.hasAudit) {
    return { kind: "RUN_AUDIT", href: "/app", apiAction: "run_audit" };
  }

  if (input.reviewQueueCount > 0) {
    return { kind: "OPEN_REVIEW", href: "/app/review" };
  }

  if (input.hasApprovedPlanWithArticleTopics) {
    return { kind: "OPEN_PLAN", href: "/app/autopilot" };
  }

  if (input.gscNeedsProperty) {
    return { kind: "SELECT_GSC", href: "/app/integrations" };
  }

  if (!input.publishingConfigured) {
    return { kind: "SETUP_PUBLISHING", href: "/app/integrations" };
  }

  return { kind: "OPEN_CONTROL_CENTER", href: "/app/autopilot-control" };
}

export function planHasApprovedArticleTopics(input: {
  monthlyPlanStatus?: string | null;
  planItemTypes?: string[] | null;
}): boolean {
  if (!input.monthlyPlanStatus) return false;
  const status = input.monthlyPlanStatus.toLowerCase();
  if (status !== "approved" && status !== "active") return false;
  const types = input.planItemTypes ?? [];
  return types.some((t) => t.toUpperCase() === "ARTICLE");
}
