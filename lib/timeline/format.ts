import type { TimelineEvent } from "@prisma/client";
import { TimelineEventSource, TimelineEventType } from "@prisma/client";

import { formatRelativeTime } from "@/lib/dashboard/display";
import { getServerStrings } from "@/lib/i18n/saas/server-strings";
import type { SaasLocale } from "@/lib/i18n/saas/locales";

import type { TimelineEventViewModel } from "./types";

function resolveAction(
  event: TimelineEvent,
  locale: SaasLocale
): TimelineEventViewModel["action"] {
  const actions = getServerStrings(locale).timeline.actions;

  if (event.relatedArticleId) {
    return {
      label: actions.openArticle,
      href: `/app/articles/${event.relatedArticleId}`,
    };
  }

  if (event.relatedReportId) {
    return {
      label: actions.openReport,
      href: "/app/reports",
    };
  }

  if (event.relatedIntegration) {
    return {
      label: actions.openIntegration,
      href: "/app/integrations",
    };
  }

  if (
    event.type === TimelineEventType.GSC_OPPORTUNITY_FOUND ||
    event.type === TimelineEventType.GSC_INSIGHT_FOUND
  ) {
    return {
      label: actions.viewInsight,
      href: "/app/integrations",
    };
  }

  if (
    event.type === TimelineEventType.AUDIT_COMPLETED ||
    event.type === TimelineEventType.SCORE_CHANGED
  ) {
    return {
      label: actions.openDashboard,
      href: "/app",
    };
  }

  if (
    event.type === TimelineEventType.TASK_CREATED ||
    event.type === TimelineEventType.CONTENT_IDEA_CREATED ||
    event.type === TimelineEventType.ARTICLE_DRAFT_CREATED ||
    event.type === TimelineEventType.SOCIAL_POST_DRAFT_CREATED ||
    event.type === TimelineEventType.MONTHLY_AUTOPILOT_PLAN_CREATED ||
    event.type === TimelineEventType.EMAIL_APPROVAL_CREATED
  ) {
    if (event.type === TimelineEventType.SOCIAL_POST_DRAFT_CREATED) {
      return { label: actions.openSocialPosts, href: "/app/social-posts" };
    }
    if (event.type === TimelineEventType.MONTHLY_AUTOPILOT_PLAN_CREATED) {
      return { label: actions.openAutopilot, href: "/app/autopilot" };
    }
    if (event.type === TimelineEventType.EMAIL_APPROVAL_CREATED) {
      return { label: actions.openEmailApprovals, href: "/app/email-approvals" };
    }
    return { label: actions.openContentPlan, href: "/app/content-plan" };
  }

  return undefined;
}

function localizedTimelineTitle(
  event: TimelineEvent,
  locale: SaasLocale
): string {
  const copy = getServerStrings(locale).timeline;

  if (event.type === TimelineEventType.SYSTEM_NOTE) {
    return copy.systemNoteTitles[event.title] ?? event.title;
  }

  if (
    event.type === TimelineEventType.TASK_CREATED &&
    event.source === TimelineEventSource.GSC
  ) {
    return copy.eventTitles.TASK_CREATED_GSC ?? event.title;
  }

  return copy.eventTitles[event.type] ?? event.title;
}

function readNumber(details: unknown, key: string): number {
  if (details && typeof details === "object" && key in details) {
    const value = (details as Record<string, unknown>)[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

/**
 * Localizes summaries that were stored as generated English text, using the
 * event's `details` for dynamic values. User-content summaries (article/task/
 * report titles, GSC insights, provider messages) fall back to the stored value.
 */
function localizedTimelineSummary(
  event: TimelineEvent,
  locale: SaasLocale
): string | undefined {
  const timeline = getServerStrings(locale).timeline;
  const copy = timeline.eventSummaries;
  const details = event.details;
  const known = event.summary
    ? timeline.knownSummaries[event.summary]
    : undefined;

  switch (event.type) {
    case TimelineEventType.AUDIT_COMPLETED:
      return copy.auditCompleted(
        readNumber(details, "findingsCount"),
        readNumber(details, "tasksCreated")
      );
    case TimelineEventType.SCORE_CHANGED: {
      const previous = details && typeof details === "object" && "previousScore" in details
        ? (details as Record<string, unknown>).previousScore
        : null;
      return copy.scoreChanged(
        previous == null ? "—" : String(previous),
        readNumber(details, "newScore"),
        readNumber(details, "delta")
      );
    }
    case TimelineEventType.AI_RECOMMENDATION_CREATED: {
      const passed =
        details && typeof details === "object" && "qualityPassed" in details
          ? Boolean((details as Record<string, unknown>).qualityPassed)
          : true;
      return passed ? copy.qualityPassed : copy.qualityNeedsReview;
    }
    case TimelineEventType.WORDPRESS_DRAFT_CREATED:
      return copy.wordpressDraftCreated;
    case TimelineEventType.SOCIAL_POST_DRAFT_CREATED: {
      const platform =
        details && typeof details === "object" && "platform" in details
          ? String((details as Record<string, unknown>).platform ?? "")
          : "";
      return copy.socialPostDraftCreated(platform || "social");
    }
    case TimelineEventType.SYSTEM_NOTE:
      if (event.title === "Social post copied") {
        return copy.socialPostCopied;
      }
      return known ?? event.summary ?? undefined;
    default:
      return known ?? event.summary ?? undefined;
  }
}

export function formatTimelineSeverityLabel(
  severity: string,
  locale: SaasLocale = "en"
): string {
  const labels = getServerStrings(locale).timeline.severityLabels;
  return labels[severity] ?? severity;
}

export function formatTimelineEvent(
  event: TimelineEvent,
  locale: SaasLocale = "en"
): TimelineEventViewModel {
  const sources = getServerStrings(locale).timeline.sources;
  const createdAt = event.createdAt.toISOString();

  return {
    id: event.id,
    type: event.type,
    source: sources[event.source] ?? event.source,
    severity: event.severity,
    title: localizedTimelineTitle(event, locale),
    summary: localizedTimelineSummary(event, locale),
    createdAt,
    relativeTime: formatRelativeTime(createdAt),
    isRead: event.isRead,
    action: resolveAction(event, locale),
  };
}

export function formatTimelineSourceLabel(
  source: string,
  locale: SaasLocale = "en"
): string {
  const sources = getServerStrings(locale).timeline.sources;
  return sources[source] ?? source;
}
