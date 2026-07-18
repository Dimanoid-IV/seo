/**
 * Dashboard primary CTA — automation-aware (Prompt 11.42 + 11.43).
 * Email/report never win as the main "what to do now".
 */

export type DashboardPrimaryCtaKind =
  | "RUN_AUDIT"
  | "CONFIRM_MONTHLY_PLAN"
  | "AUTOPILOT_ACTIVE"
  | "OPEN_REVIEW"
  | "OPEN_PLAN"
  | "SELECT_GSC"
  | "SETUP_PUBLISHING"
  | "OPEN_CONTROL_CENTER";

export type DashboardPrimaryCtaInput = {
  hasAudit: boolean;
  reviewQueueCount: number;
  readyToPublishCount?: number;
  /** Plan exists but not yet approved. */
  hasPendingPlanApproval?: boolean;
  /** Approved monthly plan with scheduled article topics. */
  hasApprovedPlanWithArticleTopics: boolean;
  nextScheduledArticleAt?: string | null;
  gscNeedsProperty: boolean;
  publishingConfigured: boolean;
  qualityRepairNeeded?: boolean;
};

export type DashboardPrimaryCtaDecision = {
  kind: DashboardPrimaryCtaKind;
  href: string;
  apiAction?: string;
  nextScheduledArticleAt?: string | null;
  readyToPublishCount?: number;
};

/**
 * Pure priority resolver. First match wins.
 * 1. No audit → check site
 * 2. Pending plan approval → confirm month
 * 3. Review queue has items → open review (ready materials)
 * 4. Approved plan active → show autopilot status
 * 5. Plan with topics but not in active automation path → open plan
 * 6. GSC property missing → select site
 * 7. Publishing not configured → setup publishing
 * 8. Else → control center
 */
export function resolveDashboardPrimaryCta(
  input: DashboardPrimaryCtaInput
): DashboardPrimaryCtaDecision {
  if (!input.hasAudit) {
    return { kind: "RUN_AUDIT", href: "/app", apiAction: "run_audit" };
  }

  if (input.hasPendingPlanApproval) {
    return {
      kind: "CONFIRM_MONTHLY_PLAN",
      href: "/app/autopilot",
    };
  }

  if (input.reviewQueueCount > 0) {
    return {
      kind: "OPEN_REVIEW",
      href: "/app/review",
      readyToPublishCount: input.readyToPublishCount ?? input.reviewQueueCount,
    };
  }

  if (input.hasApprovedPlanWithArticleTopics) {
    return {
      kind: "AUTOPILOT_ACTIVE",
      href: "/app/autopilot",
      nextScheduledArticleAt: input.nextScheduledArticleAt ?? null,
      readyToPublishCount: input.readyToPublishCount ?? 0,
    };
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

/** Next future scheduled article date from plan items. */
export function findNextScheduledArticleAt(
  items: Array<{ type?: string; scheduledFor?: string | null; status?: string }>,
  now: Date = new Date()
): string | null {
  let next: Date | null = null;
  for (const item of items) {
    if ((item.type ?? "").toUpperCase() !== "ARTICLE") continue;
    if (!item.scheduledFor) continue;
    if (item.status === "skipped" || item.status === "executed") continue;
    const at = new Date(item.scheduledFor);
    if (Number.isNaN(at.getTime())) continue;
    if (at.getTime() < now.getTime()) continue;
    if (!next || at < next) next = at;
  }
  return next ? next.toISOString() : null;
}
