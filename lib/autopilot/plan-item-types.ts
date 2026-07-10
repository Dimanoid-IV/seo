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
};

export type AutopilotPlanItemsDocument = {
  version: 1;
  period: AutopilotPlanPeriod;
  items: AutopilotPlanItem[];
  itemsApprovedAt?: string;
};

export const AUTOPILOT_PLAN_ITEMS_VERSION = 1 as const;
