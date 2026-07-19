/**
 * Single policy: may RankBoost live-publish this article via WordPress?
 * (Prompt 11.51 Part C)
 */

import {
  ArticleStatus,
  AutopilotMode,
  MonthlyAutopilotStatus,
  WordPressConnectionStatus,
} from "@prisma/client";

import {
  isPlanAutoPublishMode,
  type PlanPublishingModeValue,
} from "@/lib/autopilot/plan-publishing-mode";
import type { AutopilotPlanItem } from "@/lib/autopilot/plan-item-types";
import { isLivePublishKillSwitchEngaged } from "@/lib/integrations/live-publish-gate";

export type LivePublishBlockedReason =
  | "plan_not_approved"
  | "plan_item_not_approved"
  | "plan_review_only"
  | "autopilot_not_autopublish"
  | "quality_failed"
  | "article_status_not_publishable"
  | "ownership_mismatch"
  | "wordpress_not_connected"
  | "wordpress_unhealthy"
  | "duplicate_published"
  | "already_published_by_rankboost"
  | "wordpress_draft_exists"
  | "not_article_type"
  | "seo_fix_not_live"
  | "quota_exceeded"
  | "kill_switch_engaged"
  | "website_paused"
  | "missing_article"
  | "missing_content";

export type CanLivePublishArticleViaWordPressInput = {
  article: {
    id: string;
    websiteId: string;
    organizationId: string;
    status: ArticleStatus | string;
    qualityPassed: boolean | null;
    wordpressPostId: string | null;
    contentHtml?: string | null;
    publishedAt?: Date | null;
  } | null;
  website: { id: string; organizationId: string };
  organization: { id: string };
  planItem: Pick<
    AutopilotPlanItem,
    "id" | "type" | "status" | "generatedArticleId"
  > | null;
  planStatus: MonthlyAutopilotStatus | string;
  autopilotMode: AutopilotMode | string;
  planPublishingMode: PlanPublishingModeValue | string | null | undefined;
  wordpressConnection: {
    status: WordPressConnectionStatus | string;
    disconnectedAt?: Date | null;
    hasCredentials?: boolean;
  } | null;
  quality?: { qualityPassed?: boolean | null };
  /** When omitted, reads global kill switch. */
  killSwitch?: { engaged?: boolean };
  /** Per-website emergency pause (Prompt 11.53). */
  websiteLivePublishPaused?: boolean;
  /** Monthly quota check result — false means over limit. */
  monthlyQuotaOk?: boolean;
  /** Another article already owns this published external ID. */
  duplicatePublishedExternalId?: boolean;
};

export type CanLivePublishArticleViaWordPressResult = {
  allowed: boolean;
  blockedReason: LivePublishBlockedReason | null;
  userSafeMessage: string;
};

const PUBLISHABLE_STATUSES = new Set<string>([
  ArticleStatus.WAITING_REVIEW,
  ArticleStatus.APPROVED,
]);

const APPROVED_ITEM_STATUSES = new Set([
  "approved",
  "scheduled",
  "prepared",
]);

const USER_SAFE: Record<LivePublishBlockedReason, string> = {
  plan_not_approved: "Monthly plan must be approved before live publish.",
  plan_item_not_approved: "This plan item is not approved for publishing.",
  plan_review_only:
    "This plan is set to review before publish — live publish is off.",
  autopilot_not_autopublish:
    "Autopilot must be in Autopublish mode for live WordPress publish.",
  quality_failed: "Article did not pass the quality gate.",
  article_status_not_publishable:
    "Article must be waiting for review or approved before live publish.",
  ownership_mismatch: "Article does not belong to this website or organization.",
  wordpress_not_connected: "WordPress is not connected for this website.",
  wordpress_unhealthy: "WordPress connection is disconnected or missing credentials.",
  duplicate_published:
    "This WordPress post was already published — duplicate publish blocked.",
  already_published_by_rankboost:
    "RankBoost already published this article to WordPress.",
  wordpress_draft_exists:
    "A WordPress draft already exists — review it instead of creating a live post.",
  not_article_type: "Only ARTICLE plan items can be live-published.",
  seo_fix_not_live:
    "SEO fixes and task fixes stay review-only — they are never live-published.",
  quota_exceeded: "Monthly publishing quota has been reached.",
  kill_switch_engaged:
    "Live publish is paused by the safety kill switch. Use Review Queue.",
  website_paused:
    "Live publish is paused for this website. Resume in Autopilot to continue.",
  missing_article: "No article is linked to this plan item.",
  missing_content: "Article has no content to publish.",
};

export function canLivePublishArticleViaWordPress(
  input: CanLivePublishArticleViaWordPressInput
): CanLivePublishArticleViaWordPressResult {
  const deny = (
    blockedReason: LivePublishBlockedReason
  ): CanLivePublishArticleViaWordPressResult => ({
    allowed: false,
    blockedReason,
    userSafeMessage: USER_SAFE[blockedReason],
  });

  const killEngaged =
    typeof input.killSwitch?.engaged === "boolean"
      ? input.killSwitch.engaged
      : isLivePublishKillSwitchEngaged();

  if (killEngaged) {
    return deny("kill_switch_engaged");
  }

  if (input.websiteLivePublishPaused === true) {
    return deny("website_paused");
  }

  if (input.planStatus.toUpperCase() !== "APPROVED") {
    return deny("plan_not_approved");
  }

  if (!isPlanAutoPublishMode(input.planPublishingMode)) {
    return deny("plan_review_only");
  }

  if (input.autopilotMode !== AutopilotMode.AUTOPUBLISH) {
    return deny("autopilot_not_autopublish");
  }

  const item = input.planItem;
  if (!item) {
    return deny("plan_item_not_approved");
  }

  if (item.type === "SEO_FIX" || item.type === "TASK_FIX") {
    return deny("seo_fix_not_live");
  }

  if (item.type !== "ARTICLE") {
    return deny("not_article_type");
  }

  if (!APPROVED_ITEM_STATUSES.has(item.status)) {
    return deny("plan_item_not_approved");
  }

  const article = input.article;
  if (!article) {
    return deny("missing_article");
  }

  if (
    article.websiteId !== input.website.id ||
    article.organizationId !== input.organization.id ||
    input.website.organizationId !== input.organization.id
  ) {
    return deny("ownership_mismatch");
  }

  const qualityPassed =
    input.quality?.qualityPassed === true || article.qualityPassed === true;
  if (!qualityPassed) {
    return deny("quality_failed");
  }

  if (!PUBLISHABLE_STATUSES.has(String(article.status))) {
    if (article.status === ArticleStatus.PUBLISHED && article.wordpressPostId) {
      return deny("already_published_by_rankboost");
    }
    return deny("article_status_not_publishable");
  }

  if (article.contentHtml !== undefined && !article.contentHtml?.trim()) {
    return deny("missing_content");
  }

  if (input.duplicatePublishedExternalId === true) {
    return deny("duplicate_published");
  }

  // Already live-published by RankBoost.
  if (
    article.status === ArticleStatus.PUBLISHED &&
    article.wordpressPostId
  ) {
    return deny("already_published_by_rankboost");
  }

  // Draft already exists — do not create a second live post (UPDATE not implemented).
  if (
    article.wordpressPostId &&
    article.status === ArticleStatus.WORDPRESS_DRAFT_CREATED
  ) {
    return deny("wordpress_draft_exists");
  }

  if (article.wordpressPostId && article.publishedAt) {
    return deny("duplicate_published");
  }

  const wp = input.wordpressConnection;
  if (!wp) {
    return deny("wordpress_not_connected");
  }
  if (
    wp.status !== WordPressConnectionStatus.CONNECTED ||
    wp.disconnectedAt ||
    wp.hasCredentials === false
  ) {
    return deny("wordpress_unhealthy");
  }

  if (input.monthlyQuotaOk === false) {
    return deny("quota_exceeded");
  }

  return {
    allowed: true,
    blockedReason: null,
    userSafeMessage: "Live publish allowed for this approved plan article.",
  };
}

export function buildWordPressPublishIdempotencyKey(input: {
  articleId: string;
  planId: string;
  planItemId: string;
}): string {
  return `wordpress:publish:article:${input.articleId}:plan:${input.planId}:item:${input.planItemId}`;
}
