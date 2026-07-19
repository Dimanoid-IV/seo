/**
 * Article automation pipeline states for monthly autopilot (Prompt 11.43).
 * Stored on AutopilotPlanItem.pipelineState inside planItemsJson — no DB migration.
 */

import type { AutopilotPlanItem } from "./plan-item-types";

export type ArticlePipelineState =
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

export type PublishingPath =
  | "wordpress_draft"
  | "wordpress_live"
  | "universal_package"
  | "webhook"
  | "none";

export type LinkedArticlePipelineSnapshot = {
  status?: string | null;
  qualityPassed?: boolean | null;
  wordpressPostId?: string | null;
};

const HANDOFF_STATES = new Set<ArticlePipelineState>([
  "WORDPRESS_DRAFT_CREATED",
  "WORDPRESS_LIVE_PUBLISHED",
  "UNIVERSAL_PACKAGE_READY",
  "WEBHOOK_READY",
  "WEBHOOK_SENT",
  "PUBLISHED_MANUALLY_CONFIRMED",
]);

/**
 * Derive a clear pipeline state from plan item + linked article.
 * Prefers an explicit pipelineState when it is more advanced than inferred.
 */
export function deriveArticlePipelineState(
  item: AutopilotPlanItem,
  article?: LinkedArticlePipelineSnapshot | null
): ArticlePipelineState {
  if (item.status === "skipped") return "SKIPPED";
  if (item.status === "blocked" && item.blockedReasonKey === "unsafeArticleTopic") {
    return "FAILED";
  }
  if (item.pipelineState === "FAILED" || item.pipelineState === "SKIPPED") {
    return item.pipelineState;
  }

  if (item.pipelineState && HANDOFF_STATES.has(item.pipelineState)) {
    return item.pipelineState;
  }

  if (item.wordpressDraftCreatedAt || article?.wordpressPostId) {
    return "WORDPRESS_DRAFT_CREATED";
  }
  if (item.webhookSentAt) return "WEBHOOK_SENT";
  if (item.webhookReadyAt || item.pipelineState === "WEBHOOK_READY") {
    return "WEBHOOK_READY";
  }
  if (
    item.universalPackagePreparedAt ||
    item.pipelineState === "UNIVERSAL_PACKAGE_READY"
  ) {
    return "UNIVERSAL_PACKAGE_READY";
  }

  if (item.generatedArticleId && article) {
    if (article.qualityPassed === false || item.articleQualityPassed === false) {
      return "QUALITY_FAILED_NEEDS_REPAIR";
    }
    if (article.qualityPassed === true || item.articleQualityPassed === true) {
      // Quality passed — handoff pending until a terminal publish-path state is set.
      if (!item.universalPackagePreparedAt && !item.webhookReadyAt && !item.wordpressDraftCreatedAt) {
        return item.pipelineState === "DRAFT_READY_FOR_REVIEW"
          ? "DRAFT_READY_FOR_REVIEW"
          : "READY_FOR_PUBLISHING_HANDOFF";
      }
      return "READY_FOR_PUBLISHING_HANDOFF";
    }
    return "DRAFT_READY_FOR_REVIEW";
  }

  if (item.generatedArticleId) {
    return item.pipelineState === "DRAFT_GENERATING"
      ? "DRAFT_GENERATING"
      : "DRAFT_READY_FOR_REVIEW";
  }

  if (item.researchBrief) {
    if (item.status === "scheduled" || item.status === "approved") {
      return "SCHEDULED_FOR_DRAFT";
    }
    return "RESEARCH_READY";
  }

  if (item.status === "scheduled") return "SCHEDULED_FOR_RESEARCH";
  if (item.status === "approved") return "APPROVED_TOPIC";
  if (item.status === "proposed") return "PROPOSED_TOPIC";
  if (item.status === "prepared") return "DRAFT_READY_FOR_REVIEW";
  if (item.status === "executed" || item.status === "published") {
    if (item.publishingPath === "wordpress_live") {
      return "WORDPRESS_LIVE_PUBLISHED";
    }
    return item.publishingPath === "wordpress_draft"
      ? "WORDPRESS_DRAFT_CREATED"
      : "UNIVERSAL_PACKAGE_READY";
  }

  return item.pipelineState ?? "PROPOSED_TOPIC";
}

export function resolvePublishingPath(input: {
  wordpressConnected: boolean;
  webhookConfiguredAndTested: boolean;
}): PublishingPath {
  if (input.wordpressConnected) return "wordpress_draft";
  if (input.webhookConfiguredAndTested) return "webhook";
  return "universal_package";
}

export function nextAutomatedStepLabel(
  state: ArticlePipelineState
): string {
  switch (state) {
    case "PROPOSED_TOPIC":
    case "APPROVED_TOPIC":
      return "schedule_research";
    case "SCHEDULED_FOR_RESEARCH":
      return "prepare_research";
    case "RESEARCH_READY":
    case "SCHEDULED_FOR_DRAFT":
      return "generate_draft";
    case "DRAFT_GENERATING":
      return "wait_draft";
    case "QUALITY_FAILED_NEEDS_REPAIR":
      return "repair_quality";
    case "DRAFT_READY_FOR_REVIEW":
    case "READY_FOR_PUBLISHING_HANDOFF":
      return "prepare_publishing_handoff";
    case "WORDPRESS_DRAFT_CREATED":
      return "review_wordpress_draft";
    case "WORDPRESS_LIVE_PUBLISHED":
      return "done";
    case "UNIVERSAL_PACKAGE_READY":
      return "copy_or_send_package";
    case "WEBHOOK_READY":
      return "send_webhook_when_allowed";
    case "WEBHOOK_SENT":
    case "PUBLISHED_MANUALLY_CONFIRMED":
      return "done";
    case "SKIPPED":
    case "FAILED":
      return "none";
    default:
      return "none";
  }
}

/** Assign research/draft/publish planning timestamps around scheduledFor. */
export function assignPipelineScheduleDates(
  item: AutopilotPlanItem,
  scheduledForIso: string
): Pick<
  AutopilotPlanItem,
  "plannedResearchAt" | "plannedDraftAt" | "plannedPublishAt"
> {
  const scheduled = new Date(scheduledForIso);
  if (Number.isNaN(scheduled.getTime())) {
    return {
      plannedResearchAt: scheduledForIso,
      plannedDraftAt: scheduledForIso,
      plannedPublishAt: scheduledForIso,
    };
  }

  const researchAt = new Date(scheduled);
  // Research runs on the scheduled slot; draft same day; handoff day after draft slot.
  const draftAt = new Date(scheduled);
  const publishAt = new Date(scheduled);
  publishAt.setUTCDate(publishAt.getUTCDate() + 1);

  return {
    plannedResearchAt: researchAt.toISOString(),
    plannedDraftAt: draftAt.toISOString(),
    plannedPublishAt: publishAt.toISOString(),
  };
}

export function isHandoffComplete(item: AutopilotPlanItem): boolean {
  const state = deriveArticlePipelineState(item);
  return HANDOFF_STATES.has(state);
}
