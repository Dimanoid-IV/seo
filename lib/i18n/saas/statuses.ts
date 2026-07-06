import type { SaasLocale } from "./locales";
import { getSaasDictionary } from "./index";

export function translateContentStatus(
  locale: SaasLocale,
  status: string
): string {
  const s = getSaasDictionary(locale).contentPlan.statuses;
  const map: Record<string, string> = {
    IDEA: s.idea,
    DRAFT: s.draft,
    WAITING_REVIEW: s.waitingReview,
    APPROVED: s.approved,
    WORDPRESS_DRAFT_CREATED: s.wordpressDraft,
    READY: s.ready,
    COPIED: s.copied,
    SCHEDULED: s.scheduled,
  };
  return map[status] ?? status;
}

export function translateReportStatus(
  locale: SaasLocale,
  status: string
): string {
  const s = getSaasDictionary(locale).reports.statuses;
  const map: Record<string, string> = {
    draft: s.draft,
    ready: s.ready,
    sent: s.sent,
    failed: s.failed,
  };
  return map[status] ?? status;
}

export function translatePreparedPlanStatus(
  locale: SaasLocale,
  status?: string
): string {
  const p = getSaasDictionary(locale).statuses;
  if (!status) return p.notCreated;
  const normalized = status.toLowerCase();
  if (normalized === "approved") return p.approved;
  if (normalized === "ready") return p.ready;
  return p.draft;
}
