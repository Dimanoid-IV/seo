export type AutopilotPriority = "HIGH" | "MEDIUM" | "LOW";

export type AutopilotFocusArea = {
  id: string;
  title: string;
  description: string;
  priority: AutopilotPriority;
  reason: string;
  reasonKey?: string;
  reasonParams?: Record<string, string | number>;
  relatedTaskIds?: string[];
  relatedArticleIds?: string[];
  relatedSocialPostIds?: string[];
  relatedTimelineEventIds?: string[];
};

export type AutopilotRecommendedAction = {
  id: string;
  title: string;
  description: string;
  type: "TASK" | "ARTICLE" | "SOCIAL_POST" | "INTEGRATION" | "REVIEW" | "REPORT";
  priority: AutopilotPriority;
  href?: string;
  /** Stable key for display-time localization (future + legacy mapping). */
  key?: string;
  titleKey?: string;
  descKey?: string;
  titleParams?: Record<string, string | number>;
  descParams?: Record<string, string | number>;
};

export type AutopilotRisk = {
  title: string;
  description: string;
  severity: "WARNING" | "ERROR";
  key?: string;
  descKey?: string;
  descParams?: Record<string, string | number>;
};

export type AutopilotNextStep = {
  title: string;
  description: string;
  href?: string;
  key?: string;
  descKey?: string;
  descParams?: Record<string, string | number>;
};

export type MonthlyAutopilotMetrics = {
  growthScore?: number;
  growthScoreDelta?: number;
  openTasksCount: number;
  completedTasksCount: number;
  opportunitiesCount: number;
  warningsCount: number;
  draftArticlesCount: number;
  readySocialPostsCount: number;
};

export type MonthlyAutopilotPlanViewModel = {
  id: string;
  month: string;
  status: string;
  title: string;
  summary: string;
  metrics: MonthlyAutopilotMetrics;
  focusAreas: AutopilotFocusArea[];
  recommendedActions: AutopilotRecommendedAction[];
  risks: AutopilotRisk[];
  nextSteps: AutopilotNextStep[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  hermesSummaryUsed?: boolean;
  /** Explicit choice at plan confirm — REVIEW_ONLY | AUTO_PUBLISH */
  publishingMode?: "REVIEW_ONLY" | "AUTO_PUBLISH";
  planItems?: import("./plan-item-types").AutopilotPlanItemsDocument | null;
};

export type MonthlyAutopilotSourceSummary = {
  hasAudit: boolean;
  hasGsc: boolean;
  hasTasks: boolean;
  hasArticles: boolean;
  hasSocialPosts: boolean;
  hasTimelineEvents: boolean;
  hasOpportunities: boolean;
  hasEnoughData: boolean;
};

export type MonthlyAutopilotGetResponse = {
  plan: MonthlyAutopilotPlanViewModel | null;
  month: string;
  websiteId: string | null;
  websiteUrl: string | null;
  sourceSummary: MonthlyAutopilotSourceSummary | null;
  hermesSummaryUnavailable?: boolean;
  planItems?: import("./plan-item-types").AutopilotPlanItemsDocument | null;
  autopilotStatus?: import("./autopilot-status").AutopilotStatusSnapshot;
  autopilotSettings?: import("./autopilot-settings").AutopilotSettingsView;
  wordpressConnected?: boolean;
  lastPublishedUrl?: string | null;
  rollbackAvailable?: boolean;
  /** Env allowlist and/or DB livePublishRolloutEnabled. */
  livePublishScopedAllowed?: boolean;
};
