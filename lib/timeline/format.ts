import type { TimelineEvent } from "@prisma/client";

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
    event.type === "GSC_OPPORTUNITY_FOUND" ||
    event.type === "GSC_INSIGHT_FOUND"
  ) {
    return {
      label: actions.viewInsight,
      href: "/app/integrations",
    };
  }

  if (
    event.type === "AUDIT_COMPLETED" ||
    event.type === "SCORE_CHANGED"
  ) {
    return {
      label: actions.openDashboard,
      href: "/app",
    };
  }

  if (
    event.type === "TASK_CREATED" ||
    event.type === "CONTENT_IDEA_CREATED" ||
    event.type === "ARTICLE_DRAFT_CREATED" ||
    event.type === "SOCIAL_POST_DRAFT_CREATED" ||
    event.type === "MONTHLY_AUTOPILOT_PLAN_CREATED" ||
    event.type === "EMAIL_APPROVAL_CREATED"
  ) {
    if (event.type === "SOCIAL_POST_DRAFT_CREATED") {
      return { label: actions.openSocialPosts, href: "/app/social-posts" };
    }
    if (event.type === "MONTHLY_AUTOPILOT_PLAN_CREATED") {
      return { label: actions.openAutopilot, href: "/app/autopilot" };
    }
    if (event.type === "EMAIL_APPROVAL_CREATED") {
      return { label: actions.openEmailApprovals, href: "/app/email-approvals" };
    }
    return { label: actions.openContentPlan, href: "/app/content-plan" };
  }

  return undefined;
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
    title: event.title,
    summary: event.summary ?? undefined,
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
