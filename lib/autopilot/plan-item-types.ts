/**
 * Autopilot plan approval items stored in MonthlyAutopilotPlan.planItemsJson.
 *
 * Shape: AutopilotPlanItemsDocument
 */
export type AutopilotPlanPeriod = "weekly" | "monthly";

export type AutopilotPlanItemType =
  | "ARTICLE"
  | "SEO_FIX"
  | "SOCIAL_POST"
  | "EMAIL"
  | "TASK_FIX";

export type AutopilotPlanItemStatus =
  | "proposed"
  | "approved"
  | "scheduled"
  | "prepared"
  | "published"
  | "executed"
  | "skipped"
  | "blocked";

export type AutopilotPlanItemIntegration =
  | "none"
  | "wordpress"
  | "gsc"
  | "manual";

export type AutopilotPlanItemSourceRef = {
  type: "task" | "article" | "social_post" | "email" | "action";
  id: string;
};

export type AutopilotPlanItemPublishingPath =
  | "wordpress_draft"
  | "wordpress_live"
  | "universal_package"
  | "webhook"
  | "none";

export type AutopilotPlanItemPipelineState =
  | "PROPOSED_TOPIC"
  | "APPROVED_TOPIC"
  | "SCHEDULED_FOR_RESEARCH"
  | "RESEARCH_READY"
  | "SCHEDULED_FOR_DRAFT"
  | "DRAFT_GENERATING"
  | "DRAFT_READY_FOR_REVIEW"
  | "QUALITY_FAILED_NEEDS_REPAIR"
  | "READY_FOR_PUBLISHING_HANDOFF"
  | "WORDPRESS_DRAFT_CREATED"
  | "WORDPRESS_LIVE_PUBLISHED"
  | "UNIVERSAL_PACKAGE_READY"
  | "WEBHOOK_READY"
  | "WEBHOOK_SENT"
  | "PUBLISHED_MANUALLY_CONFIRMED"
  | "SKIPPED"
  | "FAILED";

export type AutopilotPlanItem = {
  id: string;
  type: AutopilotPlanItemType;
  title: string;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  needsIntegration: boolean;
  integrationType: AutopilotPlanItemIntegration;
  estimatedActionDate?: string;
  scheduledFor?: string;
  status: AutopilotPlanItemStatus;
  sourceRef?: AutopilotPlanItemSourceRef;
  /** UI selection state before approval; cleared after items are approved. */
  selected?: boolean;
  reviewQueueHref?: string;
  blockedReasonKey?: string;
  /**
   * Content research brief (Prompt 11.22) — embedded JSON, not a separate DB model.
   * Generated before article creation for ARTICLE items.
   */
  researchBrief?: Record<string, unknown>;
  /** Linked article draft after research-based generation (Prompt 11.23). */
  generatedArticleId?: string;
  articleQualityScore?: number;
  articleQualityPassed?: boolean;
  /** Set when the linked generated article is approved in Review Queue. */
  linkedArticleApprovedAt?: string;
  /** Prompt 11.43 — fine-grained article automation state (JSON only). */
  pipelineState?: AutopilotPlanItemPipelineState;
  plannedResearchAt?: string;
  plannedDraftAt?: string;
  plannedPublishAt?: string;
  publishingPath?: AutopilotPlanItemPublishingPath;
  universalPackagePreparedAt?: string;
  webhookReadyAt?: string;
  webhookSentAt?: string;
  wordpressDraftCreatedAt?: string;
  nextAutomatedStep?: string;
};

export type AutopilotPlanItemsDocument = {
  version: 1;
  period: AutopilotPlanPeriod;
  items: AutopilotPlanItem[];
  itemsApprovedAt?: string;
};

export const AUTOPILOT_PLAN_ITEMS_VERSION = 1 as const;

/** Maps legacy recommended action types to safe autopilot plan item types. */
export function mapRecommendedActionTypeToPlanItemType(
  actionType: string
): AutopilotPlanItemType {
  if (actionType === "ARTICLE") {
    return "ARTICLE";
  }
  if (actionType === "SOCIAL_POST") {
    return "SOCIAL_POST";
  }
  if (actionType === "INTEGRATION" || actionType === "REVIEW") {
    return "SEO_FIX";
  }
  return "TASK_FIX";
}
