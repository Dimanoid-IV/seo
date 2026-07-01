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
  input: BuildRecommendedActionsInput
): ControlCenterRecommendedAction[] {
  actionId = 0;
  const actions: ControlCenterRecommendedAction[] = [];

  if (!input.hasMonthlyPlan) {
    actions.push({
      id: nextId("plan"),
      title: "Generate this month's growth plan",
      description:
        "Organize SEO, content, and social priorities for the current month.",
      priority: "HIGH",
      type: "GENERATE_MONTHLY_PLAN",
      apiAction: "generate_monthly_plan",
    });
  }

  if (input.hasMonthlyPlan && input.pendingEmailsCount === 0) {
    actions.push({
      id: nextId("email-gen"),
      title: "Prepare review email",
      description: "Create an email draft from this month's autopilot plan.",
      priority: "MEDIUM",
      type: "GENERATE_EMAIL_APPROVAL",
      apiAction: "generate_email_approval",
    });
  }

  if (input.pendingEmailsCount > 0) {
    actions.push({
      id: nextId("email"),
      title: "Review prepared email",
      description: `${input.pendingEmailsCount} email draft(s) waiting for your review.`,
      priority: "HIGH",
      type: "REVIEW_EMAIL",
      href: "/app/email-approvals",
    });
  }

  if (input.waitingReviewArticlesCount > 0 || input.draftArticlesCount > 0) {
    actions.push({
      id: nextId("article"),
      title: "Review article drafts",
      description: `${input.waitingReviewArticlesCount + input.draftArticlesCount} article draft(s) need attention.`,
      priority: "HIGH",
      type: "REVIEW_ARTICLE",
      href: "/app/content-plan",
    });
  }

  if (input.readySocialPostsCount > 0) {
    actions.push({
      id: nextId("social"),
      title: "Copy ready social posts",
      description: `${input.readySocialPostsCount} post draft(s) ready to copy or edit.`,
      priority: "MEDIUM",
      type: "COPY_SOCIAL_POST",
      href: "/app/social-posts",
    });
  }

  if (!input.gscConnected || input.gscError) {
    actions.push({
      id: nextId("gsc"),
      title: "Connect Google Search Console",
      description: "Unlock search query opportunities and traffic insights.",
      priority: input.gscError ? "HIGH" : "MEDIUM",
      type: "CONNECT_INTEGRATION",
      href: "/app/integrations",
    });
  }

  if (input.highPriorityTasksCount > 0) {
    actions.push({
      id: nextId("task"),
      title: "Fix high-priority SEO tasks",
      description: `${input.highPriorityTasksCount} high-priority task(s) are open.`,
      priority: "HIGH",
      type: "OPEN_TASK",
      href: "/app",
    });
  }

  if (!input.hasAudit) {
    actions.push({
      id: nextId("audit"),
      title: "Run a website audit",
      description: "Refresh technical SEO findings and Growth Score.",
      priority: "MEDIUM",
      type: "RUN_AUDIT",
      href: "/app",
    });
  }

  if (input.unreadTimelineEventsCount > 0) {
    actions.push({
      id: nextId("timeline"),
      title: "Review recent growth activity",
      description: `${input.unreadTimelineEventsCount} unread timeline event(s).`,
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

export function resolveOverallStatus(input: {
  hasWebsite: boolean;
  hasAudit: boolean;
  hasUsefulData: boolean;
  needsReviewCount: number;
  integrationIssuesCount: number;
  monthlyPlanApproved: boolean;
}): ControlCenterStatus {
  if (!input.hasWebsite) {
    return {
      overall: "NEEDS_SETUP",
      label: "Setup needed",
      description: "Add a website to use Autopilot Control Center.",
    };
  }

  if (!input.hasAudit && !input.hasUsefulData) {
    return {
      overall: "NEEDS_SETUP",
      label: "Setup needed",
      description:
        "Connect data sources or run an audit so RankBoost can prepare growth actions.",
    };
  }

  if (!input.hasUsefulData) {
    return {
      overall: "NO_DATA",
      label: "Limited data",
      description:
        "Run an audit or connect Google Search Console so RankBoost can prepare growth actions.",
    };
  }

  if (
    input.needsReviewCount > 0 ||
    input.integrationIssuesCount > 0
  ) {
    return {
      overall: "NEEDS_REVIEW",
      label: "Needs review",
      description:
        "RankBoost prepared several growth actions that need your review.",
    };
  }

  if (input.monthlyPlanApproved) {
    return {
      overall: "READY",
      label: "Ready",
      description:
        "Your current growth plan is approved. RankBoost is monitoring for new opportunities.",
    };
  }

  return {
    overall: "READY",
    label: "Monitoring",
    description:
      "No urgent approvals right now. RankBoost is monitoring your website.",
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
