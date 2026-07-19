/**
 * Human-facing labels for article automation pipeline states (Prompt 11.44).
 * Never show raw enum names as primary UI copy.
 */

import type { AutopilotPlanItemPipelineState } from "@/lib/autopilot/plan-item-types";

export type PipelineHumanLabelKey =
  | "proposedTopic"
  | "approvedTopic"
  | "scheduledForResearch"
  | "researchReady"
  | "scheduledForDraft"
  | "draftGenerating"
  | "draftReadyForReview"
  | "qualityNeedsRepair"
  | "readyForPublishingHandoff"
  | "wordpressDraftCreated"
  | "wordpressLivePublished"
  | "universalPackageReady"
  | "webhookReady"
  | "webhookSent"
  | "publishedManually"
  | "skipped"
  | "failed";

const STATE_TO_KEY: Record<AutopilotPlanItemPipelineState, PipelineHumanLabelKey> = {
  PROPOSED_TOPIC: "proposedTopic",
  APPROVED_TOPIC: "approvedTopic",
  SCHEDULED_FOR_RESEARCH: "scheduledForResearch",
  RESEARCH_READY: "researchReady",
  SCHEDULED_FOR_DRAFT: "scheduledForDraft",
  DRAFT_GENERATING: "draftGenerating",
  DRAFT_READY_FOR_REVIEW: "draftReadyForReview",
  QUALITY_FAILED_NEEDS_REPAIR: "qualityNeedsRepair",
  READY_FOR_PUBLISHING_HANDOFF: "readyForPublishingHandoff",
  WORDPRESS_DRAFT_CREATED: "wordpressDraftCreated",
  WORDPRESS_LIVE_PUBLISHED: "wordpressLivePublished",
  UNIVERSAL_PACKAGE_READY: "universalPackageReady",
  WEBHOOK_READY: "webhookReady",
  WEBHOOK_SENT: "webhookSent",
  PUBLISHED_MANUALLY_CONFIRMED: "publishedManually",
  SKIPPED: "skipped",
  FAILED: "failed",
};

export function pipelineStateToLabelKey(
  state: string | null | undefined
): PipelineHumanLabelKey | null {
  if (!state) return null;
  if (state in STATE_TO_KEY) {
    return STATE_TO_KEY[state as AutopilotPlanItemPipelineState];
  }
  return null;
}

/** Default RU labels — dictionaries override via i18n. */
export const PIPELINE_LABELS_RU: Record<PipelineHumanLabelKey, string> = {
  proposedTopic: "Тема предложена",
  approvedTopic: "Тема одобрена",
  scheduledForResearch: "Запланировано исследование",
  researchReady: "Исследование готово",
  scheduledForDraft: "Черновик в расписании",
  draftGenerating: "RankBoost готовит статью",
  draftReadyForReview: "Статья готова к проверке",
  qualityNeedsRepair: "Статья требует доработки",
  readyForPublishingHandoff: "Готово к публикации",
  wordpressDraftCreated: "Черновик WordPress создан",
  wordpressLivePublished: "Опубликовано в WordPress",
  universalPackageReady: "Готов пакет для публикации",
  webhookReady: "Готово к отправке на сайт",
  webhookSent: "Отправлено на сайт",
  publishedManually: "Опубликовано вручную",
  skipped: "Пропущено",
  failed: "Не удалось подготовить",
};

export type PublishingPathChip =
  | "manual"
  | "wordpress_draft"
  | "wordpress_live"
  | "webhook_ready";

export function publishingPathChip(
  path: string | null | undefined
): PublishingPathChip {
  if (path === "wordpress_draft") return "wordpress_draft";
  if (path === "wordpress_live") return "wordpress_live";
  if (path === "webhook") return "webhook_ready";
  return "manual";
}
