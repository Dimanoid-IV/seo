import { ArticleStatus, AutopilotMode } from "@prisma/client";

import type { AutopilotPlanItem } from "./plan-item-types";

export type ExecutionActionType =
  | "PREPARE_ARTICLE_DRAFT"
  | "PUBLISH_APPROVED_ARTICLE"
  | "NOOP_INTERNAL"
  | "BLOCKED"
  | "SKIP";

export type ExecutionReasonKey =
  | "notSelected"
  | "terminalStatus"
  | "notCandidateStatus"
  | "notDueYet"
  | "autopilotOff"
  | "preparationDisabled"
  | "publishDisabled"
  | "researchBriefMissing"
  | "readyForDraftPreparation"
  | "generatedArticleMissing"
  | "articleNotFound"
  | "articleOwnershipMismatch"
  | "articleQualityFailed"
  | "waitingForReviewApproval"
  | "articleNotApproved"
  | "wordpressNotConnected"
  | "wordpressDraftAlreadyCreated"
  | "nonArticleNoop"
  | "blockedStatus";

export type LinkedArticleSnapshot = {
  id: string;
  status: ArticleStatus;
  qualityPassed: boolean | null;
  websiteId: string;
  organizationId: string;
  wordpressPostId: string | null;
};

export type ExecutionEligibilityInput = {
  item: AutopilotPlanItem;
  now: Date;
  autopilotMode: AutopilotMode;
  wordpressConnected: boolean;
  websiteId: string;
  organizationId: string;
  article?: LinkedArticleSnapshot | null;
  /** When true, ignore scheduledFor timing (manual preview / dry-run inspection). */
  manualPreview?: boolean;
};

export type ExecutionEligibilityResult = {
  eligible: boolean;
  action: ExecutionActionType;
  reasonKey: ExecutionReasonKey;
  summaryKey?: string;
  suggestedStatus?: AutopilotPlanItem["status"];
  persistBlocked?: boolean;
};

const CANDIDATE_STATUSES = new Set<AutopilotPlanItem["status"]>([
  "approved",
  "scheduled",
  "prepared",
]);

const TERMINAL_STATUSES = new Set<AutopilotPlanItem["status"]>([
  "skipped",
  "executed",
  "published",
]);

const PREPARATION_MODES = new Set<AutopilotMode>([
  AutopilotMode.REVIEW_FIRST,
  AutopilotMode.APPROVED_PLAN_AUTOPILOT,
  AutopilotMode.AUTOPUBLISH,
]);

const PUBLISH_MODES = new Set<AutopilotMode>([
  AutopilotMode.REVIEW_FIRST,
  AutopilotMode.APPROVED_PLAN_AUTOPILOT,
  AutopilotMode.AUTOPUBLISH,
]);

function skip(
  reasonKey: ExecutionReasonKey,
  summaryKey?: string
): ExecutionEligibilityResult {
  return {
    eligible: false,
    action: "SKIP",
    reasonKey,
    summaryKey,
  };
}

function blocked(
  reasonKey: ExecutionReasonKey,
  summaryKey?: string
): ExecutionEligibilityResult {
  return {
    eligible: false,
    action: "BLOCKED",
    reasonKey,
    summaryKey,
    suggestedStatus: "blocked",
    persistBlocked: true,
  };
}

function eligibleAction(
  action: Exclude<ExecutionActionType, "SKIP" | "BLOCKED">,
  reasonKey: ExecutionReasonKey,
  summaryKey?: string,
  suggestedStatus?: AutopilotPlanItem["status"]
): ExecutionEligibilityResult {
  return {
    eligible: true,
    action,
    reasonKey,
    summaryKey,
    suggestedStatus,
  };
}

function isDue(item: AutopilotPlanItem, now: Date, manualPreview?: boolean): boolean {
  if (manualPreview) return true;
  if (!item.scheduledFor) return false;
  const scheduled = new Date(item.scheduledFor);
  if (Number.isNaN(scheduled.getTime())) return false;
  return scheduled.getTime() <= now.getTime();
}

function isArticleApprovedForPublish(status: ArticleStatus): boolean {
  return status === ArticleStatus.APPROVED;
}

function isArticleWaitingForReview(status: ArticleStatus): boolean {
  return status === ArticleStatus.WAITING_REVIEW;
}

function isArticleDraftOnly(status: ArticleStatus): boolean {
  return status === ArticleStatus.DRAFT || status === ArticleStatus.IDEA;
}

/**
 * Determines whether an autopilot plan item can execute now and which safe action applies.
 */
export function resolvePlanItemExecutionEligibility(
  input: ExecutionEligibilityInput
): ExecutionEligibilityResult {
  const { item, now, autopilotMode, wordpressConnected, websiteId, organizationId, article } =
    input;

  if (item.selected === false) {
    return skip("notSelected");
  }

  if (item.status === "blocked") {
    return skip("blockedStatus", item.blockedReasonKey);
  }

  if (TERMINAL_STATUSES.has(item.status)) {
    return skip("terminalStatus");
  }

  if (!CANDIDATE_STATUSES.has(item.status)) {
    return skip("notCandidateStatus");
  }

  if (!isDue(item, now, input.manualPreview)) {
    return skip("notDueYet");
  }

  if (autopilotMode === AutopilotMode.OFF) {
    return skip("autopilotOff", "autopilotOff");
  }

  if (item.type !== "ARTICLE") {
    return eligibleAction("NOOP_INTERNAL", "nonArticleNoop", "nonArticleNoop", item.status);
  }

  if (!item.generatedArticleId) {
    if (!item.researchBrief) {
      return blocked("researchBriefMissing", "researchBriefMissing");
    }

    if (!PREPARATION_MODES.has(autopilotMode)) {
      return skip("preparationDisabled", "draftWillBePrepared");
    }

    return eligibleAction(
      "PREPARE_ARTICLE_DRAFT",
      "readyForDraftPreparation",
      "draftWillBePrepared",
      "prepared"
    );
  }

  if (!article) {
    return skip("articleNotFound", "generatedArticleMissing");
  }

  if (article.id !== item.generatedArticleId) {
    return skip("articleNotFound", "generatedArticleMissing");
  }

  if (article.websiteId !== websiteId || article.organizationId !== organizationId) {
    return blocked("articleOwnershipMismatch", "articleOwnershipMismatch");
  }

  if (item.articleQualityPassed === false || article.qualityPassed === false) {
    return skip("articleQualityFailed", "qualityFailed");
  }

  if (isArticleWaitingForReview(article.status)) {
    return skip("waitingForReviewApproval", "waitingForReviewApproval");
  }

  if (isArticleDraftOnly(article.status)) {
    return skip("articleNotApproved", "qualityFailed");
  }

  if (article.wordpressPostId || article.status === ArticleStatus.WORDPRESS_DRAFT_CREATED) {
    return eligibleAction(
      "NOOP_INTERNAL",
      "wordpressDraftAlreadyCreated",
      "wordpressDraftCreated",
      "executed"
    );
  }

  if (article.status === ArticleStatus.PUBLISHED) {
    return eligibleAction("NOOP_INTERNAL", "wordpressDraftAlreadyCreated", "published", "executed");
  }

  if (!isArticleApprovedForPublish(article.status)) {
    return skip("articleNotApproved", "waitingForReviewApproval");
  }

  if (!PUBLISH_MODES.has(autopilotMode)) {
    return skip("publishDisabled", "waitingForReviewApproval");
  }

  if (!wordpressConnected) {
    return blocked("wordpressNotConnected", "wordpressRequired");
  }

  return eligibleAction(
    "PUBLISH_APPROVED_ARTICLE",
    "articleNotApproved",
    "wordpressDraftCreated",
    "executed"
  );
}

export function isPlanItemDueNow(
  item: AutopilotPlanItem,
  now: Date = new Date()
): boolean {
  if (item.selected === false) return false;
  if (!CANDIDATE_STATUSES.has(item.status)) return false;
  if (TERMINAL_STATUSES.has(item.status)) return false;
  return isDue(item, now);
}

export function findDuePlanItems(
  items: AutopilotPlanItem[],
  now: Date = new Date()
): AutopilotPlanItem[] {
  return items.filter((item) => isPlanItemDueNow(item, now));
}
