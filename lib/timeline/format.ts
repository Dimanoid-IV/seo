import type { TimelineEvent } from "@prisma/client";

import { formatRelativeTime } from "@/lib/dashboard/display";

import type { TimelineEventViewModel } from "./types";

const SOURCE_LABELS: Record<string, string> = {
  AUDIT_ENGINE: "Audit Engine",
  RULE_ENGINE: "Rule Engine",
  GROWTH_SCORE: "Growth Score",
  TASKS: "Tasks",
  CONTENT_PLAN: "Content Plan",
  REPORTS: "Reports",
  GSC: "Search Console",
  WORDPRESS: "WordPress",
  HERMES: "Hermes AI",
  AI_QUALITY_PIPELINE: "AI Quality",
  CONTINUOUS_IMPROVEMENT: "Growth Engine",
  SYSTEM: "System",
};

function resolveAction(event: TimelineEvent): TimelineEventViewModel["action"] {
  if (event.relatedArticleId) {
    return {
      label: "Open article",
      href: `/app/articles/${event.relatedArticleId}`,
    };
  }

  if (event.relatedReportId) {
    return {
      label: "Open report",
      href: "/app/reports",
    };
  }

  if (event.relatedIntegration) {
    return {
      label: "Open integration",
      href: "/app/integrations",
    };
  }

  if (
    event.type === "GSC_OPPORTUNITY_FOUND" ||
    event.type === "GSC_INSIGHT_FOUND"
  ) {
    return {
      label: "View insight",
      href: "/app/integrations",
    };
  }

  if (
    event.type === "AUDIT_COMPLETED" ||
    event.type === "SCORE_CHANGED"
  ) {
    return {
      label: "Open dashboard",
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
      return { label: "Open social posts", href: "/app/social-posts" };
    }
    if (event.type === "MONTHLY_AUTOPILOT_PLAN_CREATED") {
      return { label: "Open autopilot", href: "/app/autopilot" };
    }
    if (event.type === "EMAIL_APPROVAL_CREATED") {
      return { label: "Open email approvals", href: "/app/email-approvals" };
    }
    return { label: "Open content plan", href: "/app/content-plan" };
  }

  return undefined;
}

export function formatTimelineEvent(event: TimelineEvent): TimelineEventViewModel {
  const createdAt = event.createdAt.toISOString();

  return {
    id: event.id,
    type: event.type,
    source: SOURCE_LABELS[event.source] ?? event.source,
    severity: event.severity,
    title: event.title,
    summary: event.summary ?? undefined,
    createdAt,
    relativeTime: formatRelativeTime(createdAt),
    isRead: event.isRead,
    action: resolveAction(event),
  };
}

export function formatTimelineSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}
