export type ControlCenterOverallStatus =
  | "READY"
  | "NEEDS_REVIEW"
  | "NEEDS_SETUP"
  | "NO_DATA";

export type ControlCenterStatus = {
  overall: ControlCenterOverallStatus;
  label: string;
  description: string;
};

export type ControlCenterMetrics = {
  growthScore?: number;
  growthScoreDelta?: number;
  openTasksCount: number;
  highPriorityTasksCount: number;
  pendingEmailsCount: number;
  draftArticlesCount: number;
  readySocialPostsCount: number;
  integrationIssuesCount: number;
  unreadTimelineEventsCount: number;
};

export type ControlCenterMonthlyPlan = {
  id: string;
  month: string;
  status: string;
  title: string;
  summary?: string;
  href: string;
};

export type ApprovalQueueItem = {
  id: string;
  type:
    | "EMAIL"
    | "ARTICLE"
    | "SOCIAL_POST"
    | "MONTHLY_PLAN"
    | "WORDPRESS_DRAFT"
    | "TASK"
    | "INTEGRATION";
  title: string;
  description?: string;
  status: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  href?: string;
  actionLabel?: string;
  actionType?: string;
};

export type ControlCenterRecommendedAction = {
  id: string;
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  type:
    | "GENERATE_MONTHLY_PLAN"
    | "GENERATE_EMAIL_APPROVAL"
    | "REVIEW_EMAIL"
    | "REVIEW_ARTICLE"
    | "COPY_SOCIAL_POST"
    | "OPEN_TASK"
    | "CONNECT_INTEGRATION"
    | "VIEW_TIMELINE"
    | "RUN_AUDIT";
  href?: string;
  apiAction?: string;
};

export type ControlCenterRecentActivity = {
  id: string;
  title: string;
  summary?: string;
  severity: string;
  source: string;
  createdAt: string;
  href?: string;
};

export type ControlCenterIntegration = {
  key: string;
  name: string;
  status: "CONNECTED" | "MISSING" | "ERROR";
  description?: string;
  href?: string;
};

export type AutopilotControlCenterViewModel = {
  website: {
    id: string;
    name?: string;
    domain?: string;
  } | null;
  status: ControlCenterStatus;
  metrics: ControlCenterMetrics;
  monthlyPlan?: ControlCenterMonthlyPlan;
  approvalQueue: ApprovalQueueItem[];
  recommendedActions: ControlCenterRecommendedAction[];
  recentActivity: ControlCenterRecentActivity[];
  integrations: ControlCenterIntegration[];
};

export type AutopilotControlCenterResponse = {
  controlCenter: AutopilotControlCenterViewModel;
};
