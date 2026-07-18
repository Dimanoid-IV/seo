export type ReviewItemType =
  | "SOCIAL_POST"
  | "EMAIL_DRAFT"
  | "ARTICLE_DRAFT"
  | "SEO_FIX"
  | "META_FIX"
  | "TASK_FIX";

export type ReviewActionNeeded =
  | "READY_TO_APPROVE"
  | "READY_TO_PUBLISH_HANDOFF"
  | "QUALITY_NEEDS_REPAIR"
  | "WORDPRESS_DRAFT_CREATED"
  | "CUSTOM_PACKAGE_READY"
  | "OTHER";

export type ReviewItemGroup = "ALL" | "SEO" | "CONTENT" | "SOCIAL" | "EMAIL";

export type ReviewItemStatus =
  | "AWAITING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DRAFT"
  | "READY_TO_PUBLISH";

export type ReviewQueueItem = {
  id: string;
  sourceId: string;
  type: ReviewItemType;
  group: Exclude<ReviewItemGroup, "ALL">;
  title: string;
  preview: string;
  status: ReviewItemStatus;
  sourceTaskId?: string;
  sourceTaskTitle?: string;
  createdAt: string;
  updatedAt: string;
  editHref?: string;
  canEdit: boolean;
  canApprove: boolean;
  /** Prompt 11.43 — what the user should do next. */
  actionNeeded?: ReviewActionNeeded;
  articleContext?: {
    qualityScore: number | null;
    qualityPassed: boolean | null;
    linkedAutopilotPlanItem: boolean;
    autopilotUnlockOnApprove: boolean;
    publishPath?: "wordpress_draft" | "universal_package" | "webhook" | "none";
    pipelineState?: string;
    plannedDate?: string | null;
    nextAutomatedStep?: string | null;
    wordpressDraftCreated?: boolean;
  };
  preparedFix?: {
    generatedBy: PreparedFixGeneratedBy;
    fallbackUsed: boolean;
    summary?: string;
    whyItMatters?: string;
    implementationNotes?: string;
    riskLevel?: PreparedFixRiskLevel;
    approvalRequired: boolean;
  };
};

export type ReviewQueueData = {
  website: { id: string; url: string } | null;
  items: ReviewQueueItem[];
  counts: {
    total: number;
    seo: number;
    content: number;
    social: number;
    email: number;
  };
};

export type PreparedFixStatus = "AWAITING_REVIEW" | "APPROVED" | "REJECTED";

export type PreparedFixGeneratedBy = "HERMES" | "TEMPLATE";

export type PreparedFixRiskLevel = "low" | "medium" | "high";

export type PreparedFixIntegrationRequirement =
  | "none"
  | "wordpress"
  | "gsc"
  | "manual";

export type PreparedFix = {
  id: string;
  type: "META_FIX" | "SEO_FIX" | "TASK_FIX";
  status: PreparedFixStatus;
  field?: string;
  title: string;
  preview: string;
  suggestedValue: string;
  summary?: string;
  whyItMatters?: string;
  implementationNotes?: string;
  riskLevel?: PreparedFixRiskLevel;
  requiresIntegration?: PreparedFixIntegrationRequirement;
  approvalRequired: boolean;
  generatedBy: PreparedFixGeneratedBy;
  generatedAt: string;
  fallbackUsed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReviewAction = "APPROVE" | "REJECT" | "EDIT" | "MARK_DONE";
