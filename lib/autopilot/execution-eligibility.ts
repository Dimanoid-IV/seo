import { ArticleStatus, AutopilotMode } from "@prisma/client";

import { isResearchBriefReadyForArticleGeneration } from "@/lib/content-research/readiness";
import { isHandoffComplete } from "./article-pipeline";

import type { AutopilotPlanItem } from "./plan-item-types";

export type ExecutionActionType =
  | "PREPARE_RESEARCH_BRIEF"
  | "PREPARE_ARTICLE_DRAFT"
  | "PREPARE_PUBLISHING_HANDOFF"
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
  | "researchBriefBlocked"
  | "readyForResearch"
  | "notAContentOpportunity"
  | "unsafeArticleTopic"
  | "archivedArticleLinked"
  | "readyForDraftPreparation"
  | "generatedArticleMissing"
  | "articleNotFound"
  | "articleOwnershipMismatch"
  | "articleQualityFailed"
  | "waitingForReviewApproval"
  | "articleNotApproved"
  | "readyForPublishingHandoff"
  | "readyForWordPressDraft"
  | "wordpressNotConnected"
  | "wordpressDraftAlreadyCreated"
  | "universalPackageReady"
  | "webhookReady"
  | "nonArticleNoop"
  | "blockedStatus"
  | "handoffComplete"
  | "runBudgetExhausted";

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
  /** Website-level custom webhook tested+configured. */
  webhookConfiguredAndTested?: boolean;
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

const HANDOFF_MODES = new Set<AutopilotMode>([
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

/**
 * Determines whether an autopilot plan item can execute now and which safe action applies.
 */
export function resolvePlanItemExecutionEligibility(
  input: ExecutionEligibilityInput
): ExecutionEligibilityResult {
  const {
    item,
    now,
    autopilotMode,
    wordpressConnected,
    websiteId,
    organizationId,
    article,
  } = input;

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

  // --- Research ---
  if (!item.researchBrief) {
    if (!PREPARATION_MODES.has(autopilotMode)) {
      return skip("preparationDisabled", "researchWillBePrepared");
    }
    return eligibleAction(
      "PREPARE_RESEARCH_BRIEF",
      "readyForResearch",
      "wouldResearch",
      "scheduled"
    );
  }

  if (!isResearchBriefReadyForArticleGeneration(item.researchBrief)) {
    return blocked("researchBriefBlocked", "researchBriefBlocked");
  }

  // --- Draft ---
  if (!item.generatedArticleId) {
    if (!PREPARATION_MODES.has(autopilotMode)) {
      return skip("preparationDisabled", "draftWillBePrepared");
    }
    return eligibleAction(
      "PREPARE_ARTICLE_DRAFT",
      "readyForDraftPreparation",
      "wouldGenerateDraft",
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

  if (article.status === ArticleStatus.ARCHIVED) {
    return blocked("archivedArticleLinked", "archivedArticleLinked");
  }

  if (item.articleQualityPassed === false || article.qualityPassed === false) {
    return skip("articleQualityFailed", "qualityFailed");
  }

  // Quality passed — prepare publishing handoff automatically in approved-plan mode
  // (WP draft / universal package / webhook ready). Never live-publish.
  if (
    (article.qualityPassed === true || item.articleQualityPassed === true) &&
    !isHandoffComplete(item) &&
    !article.wordpressPostId
  ) {
    if (!HANDOFF_MODES.has(autopilotMode)) {
      // REVIEW_FIRST: wait for human approval before handoff.
      if (isArticleWaitingForReview(article.status)) {
        return skip("waitingForReviewApproval", "waitingForReviewApproval");
      }
    } else {
      return eligibleAction(
        "PREPARE_PUBLISHING_HANDOFF",
        "readyForPublishingHandoff",
        wordpressConnected
          ? "wouldCreateWordPressDraft"
          : input.webhookConfiguredAndTested
            ? "wouldPrepareWebhookReady"
            : "wouldPrepareUniversalPackage",
        "prepared"
      );
    }
  }

  if (isHandoffComplete(item) || article.wordpressPostId) {
    return eligibleAction(
      "NOOP_INTERNAL",
      "handoffComplete",
      item.pipelineState === "WORDPRESS_DRAFT_CREATED" || article.wordpressPostId
        ? "wordpressDraftCreated"
        : item.pipelineState === "WEBHOOK_READY"
          ? "webhookReady"
          : "universalPackageReady",
      "executed"
    );
  }

  if (isArticleWaitingForReview(article.status)) {
    return skip("waitingForReviewApproval", "waitingForReviewApproval");
  }

  // Legacy path: after user approves article, create WP draft if still missing.
  if (isArticleApprovedForPublish(article.status) && wordpressConnected && !article.wordpressPostId) {
    if (!HANDOFF_MODES.has(autopilotMode) && autopilotMode !== AutopilotMode.REVIEW_FIRST) {
      return skip("publishDisabled", "waitingForReviewApproval");
    }
    return eligibleAction(
      "PUBLISH_APPROVED_ARTICLE",
      "readyForWordPressDraft",
      "wouldCreateWordPressDraft",
      "executed"
    );
  }

  if (isArticleApprovedForPublish(article.status) && !wordpressConnected) {
    // Custom site — handoff should already have run; if not, prepare package.
    if (!isHandoffComplete(item)) {
      return eligibleAction(
        "PREPARE_PUBLISHING_HANDOFF",
        "readyForPublishingHandoff",
        "wouldPrepareUniversalPackage",
        "prepared"
      );
    }
    return skip("handoffComplete", "universalPackageReady");
  }

  return skip("articleNotApproved", "articleNotApproved");
}

export type DryRunOutcome = "wouldRun" | "skipped" | "blocked";

/**
 * Honest dry-run classification: an item only counts as "wouldRun" when the
 * runner would perform a real action. NOOP_INTERNAL items that merely keep the
 * current status (e.g. non-article TASK_FIX/SEO_FIX) do nothing, so they must be
 * reported as skipped, not executed.
 */
export function classifyDryRunOutcome(
  result: ExecutionEligibilityResult
): DryRunOutcome {
  if (result.action === "BLOCKED") {
    return "blocked";
  }

  if (!result.eligible) {
    return "skipped";
  }

  if (
    result.action === "PREPARE_RESEARCH_BRIEF" ||
    result.action === "PREPARE_ARTICLE_DRAFT" ||
    result.action === "PREPARE_PUBLISHING_HANDOFF" ||
    result.action === "PUBLISH_APPROVED_ARTICLE"
  ) {
    return "wouldRun";
  }

  if (result.action === "NOOP_INTERNAL") {
    return result.suggestedStatus === "executed" ? "wouldRun" : "skipped";
  }

  return "skipped";
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

/** Per-website run budget to avoid Hermes/cost storms. */
export type RunBudget = {
  researchRemaining: number;
  draftRemaining: number;
  handoffRemaining: number;
};

export function createDefaultRunBudget(): RunBudget {
  return {
    researchRemaining: 1,
    draftRemaining: 1,
    handoffRemaining: 3,
  };
}

export function consumeBudgetForAction(
  budget: RunBudget,
  action: ExecutionActionType
): boolean {
  if (action === "PREPARE_RESEARCH_BRIEF") {
    if (budget.researchRemaining <= 0) return false;
    budget.researchRemaining -= 1;
    return true;
  }
  if (action === "PREPARE_ARTICLE_DRAFT") {
    if (budget.draftRemaining <= 0) return false;
    budget.draftRemaining -= 1;
    return true;
  }
  if (
    action === "PREPARE_PUBLISHING_HANDOFF" ||
    action === "PUBLISH_APPROVED_ARTICLE"
  ) {
    if (budget.handoffRemaining <= 0) return false;
    budget.handoffRemaining -= 1;
    return true;
  }
  return true;
}
