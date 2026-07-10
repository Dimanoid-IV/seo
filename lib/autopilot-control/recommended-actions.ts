import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { DEFAULT_SAAS_LOCALE } from "@/lib/i18n/saas/locales";
import { getServerStrings } from "@/lib/i18n/saas/server-strings";

import type {
  ApprovalQueueItem,
  ControlCenterMetrics,
  ControlCenterRecommendedAction,
  ControlCenterStatus,
} from "./types";

type BuildRecommendedActionsInput = {
  hasMonthlyPlan: boolean;
  monthlyPlanApproved: boolean;
  pendingEmailsCount: number;
  draftArticlesCount: number;
  waitingReviewArticlesCount: number;
  readySocialPostsCount: number;
  highPriorityTasksCount: number;
  gscConnected: boolean;
  gscError: boolean;
  hasAudit: boolean;
  unreadTimelineEventsCount: number;
};

let actionId = 0;

function nextId(prefix: string): string {
  actionId += 1;
  return `${prefix}-${actionId}`;
}

export function buildRecommendedActions(
  input: BuildRecommendedActionsInput,
  locale: SaasLocale = DEFAULT_SAAS_LOCALE
): ControlCenterRecommendedAction[] {
  actionId = 0;
  const r = getServerStrings(locale).controlCenter.recommended;
  const actions: ControlCenterRecommendedAction[] = [];

  if (!input.hasMonthlyPlan) {
    actions.push({
      id: nextId("plan"),
      title: r.generatePlanTitle,
      description: r.generatePlanDesc,
      priority: "HIGH",
      type: "GENERATE_MONTHLY_PLAN",
      apiAction: "generate_monthly_plan",
    });
  }

  if (input.hasMonthlyPlan && input.pendingEmailsCount === 0) {
    actions.push({
      id: nextId("email-gen"),
      title: r.prepareEmailTitle,
      description: r.prepareEmailDesc,
      priority: "MEDIUM",
      type: "GENERATE_EMAIL_APPROVAL",
      apiAction: "generate_email_approval",
    });
  }

  if (input.pendingEmailsCount > 0) {
    actions.push({
      id: nextId("email"),
      title: r.reviewEmailTitle,
      description: r.reviewEmailDesc(input.pendingEmailsCount),
      priority: "HIGH",
      type: "REVIEW_EMAIL",
      href: "/app/email-approvals",
    });
  }

  if (input.waitingReviewArticlesCount > 0 || input.draftArticlesCount > 0) {
    actions.push({
      id: nextId("article"),
      title: r.reviewArticlesTitle,
      description: r.reviewArticlesDesc(
        input.waitingReviewArticlesCount + input.draftArticlesCount
      ),
      priority: "HIGH",
      type: "REVIEW_ARTICLE",
      href: "/app/content-plan",
    });
  }

  if (input.readySocialPostsCount > 0) {
    actions.push({
      id: nextId("social"),
      title: r.copySocialTitle,
      description: r.copySocialDesc(input.readySocialPostsCount),
      priority: "MEDIUM",
      type: "COPY_SOCIAL_POST",
      href: "/app/social-posts",
    });
  }

  if (!input.gscConnected || input.gscError) {
    actions.push({
      id: nextId("gsc"),
      title: r.connectGscTitle,
      description: r.connectGscDesc,
      priority: input.gscError ? "HIGH" : "MEDIUM",
      type: "CONNECT_INTEGRATION",
      href: "/app/integrations",
    });
  }

  if (input.highPriorityTasksCount > 0) {
    actions.push({
      id: nextId("task"),
      title: r.fixTasksTitle,
      description: r.fixTasksDesc(input.highPriorityTasksCount),
      priority: "HIGH",
      type: "OPEN_TASK",
      href: "/app/tasks",
    });
  }

  if (!input.hasAudit) {
    actions.push({
      id: nextId("audit"),
      title: r.runAuditTitle,
      description: r.runAuditDesc,
      priority: "MEDIUM",
      type: "RUN_AUDIT",
      href: "/app",
    });
  }

  if (input.unreadTimelineEventsCount > 0) {
    actions.push({
      id: nextId("timeline"),
      title: r.reviewTimelineTitle,
      description: r.reviewTimelineDesc(input.unreadTimelineEventsCount),
      priority: "LOW",
      type: "VIEW_TIMELINE",
      href: "/app/timeline",
    });
  }

  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return actions
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 7);
}

export function resolveOverallStatus(
  input: {
    hasWebsite: boolean;
    hasAudit: boolean;
    hasUsefulData: boolean;
    needsReviewCount: number;
    integrationIssuesCount: number;
    monthlyPlanApproved: boolean;
  },
  locale: SaasLocale = DEFAULT_SAAS_LOCALE
): ControlCenterStatus {
  const s = getServerStrings(locale).controlCenter.status;

  if (!input.hasWebsite) {
    return {
      overall: "NEEDS_SETUP",
      label: s.setupNeeded,
      description: s.setupNeededDesc,
    };
  }

  if (!input.hasAudit && !input.hasUsefulData) {
    return {
      overall: "NEEDS_SETUP",
      label: s.setupNeeded,
      description: s.setupNeededNoData,
    };
  }

  if (!input.hasUsefulData) {
    return {
      overall: "NO_DATA",
      label: s.limitedData,
      description: s.limitedDataDesc,
    };
  }

  if (input.needsReviewCount > 0 || input.integrationIssuesCount > 0) {
    return {
      overall: "NEEDS_REVIEW",
      label: s.needsReview,
      description: s.needsReviewDesc,
    };
  }

  if (input.monthlyPlanApproved) {
    return {
      overall: "READY",
      label: s.ready,
      description: s.readyDesc,
    };
  }

  return {
    overall: "READY",
    label: s.monitoring,
    description: s.monitoringDesc,
  };
}

export function countNeedsReview(queue: ApprovalQueueItem[]): number {
  return queue.filter((item) => item.priority !== "LOW").length;
}

export function emptyMetrics(): ControlCenterMetrics {
  return {
    openTasksCount: 0,
    highPriorityTasksCount: 0,
    pendingEmailsCount: 0,
    draftArticlesCount: 0,
    readySocialPostsCount: 0,
    integrationIssuesCount: 0,
    unreadTimelineEventsCount: 0,
  };
}
