/**
 * Policy: may RankBoost roll back this live-published WordPress article?
 * (Prompt 11.53 Part C)
 */
import {
  ArticleStatus,
  IntegrationExecutionAction,
  IntegrationExecutionStatus,
  WordPressConnectionStatus,
} from "@prisma/client";

export type RollbackBlockedReason =
  | "article_not_published"
  | "missing_wordpress_post_id"
  | "not_rankboost_published"
  | "ownership_mismatch"
  | "wordpress_not_connected"
  | "wordpress_unhealthy"
  | "missing_article";

export type CanRollbackArticleViaWordPressInput = {
  article: {
    id: string;
    websiteId: string;
    organizationId: string;
    status: ArticleStatus | string;
    wordpressPostId: string | null;
  } | null;
  website: { id: string; organizationId: string };
  organization: { id: string };
  wordpressConnection: {
    status: WordPressConnectionStatus | string;
    disconnectedAt?: Date | null;
    hasCredentials?: boolean;
  } | null;
  /** True when a SUCCEEDED WordPress PUBLISH job exists for this article. */
  rankBoostPublishJobExists: boolean;
};

export type CanRollbackArticleViaWordPressResult = {
  allowed: boolean;
  blockedReason: RollbackBlockedReason | null;
  userSafeMessage: string;
};

const USER_SAFE: Record<RollbackBlockedReason, string> = {
  article_not_published: "Only live-published articles can be rolled back.",
  missing_wordpress_post_id: "No WordPress post is linked to this article.",
  not_rankboost_published:
    "Rollback is only available for posts RankBoost published.",
  ownership_mismatch: "Article does not belong to this website or organization.",
  wordpress_not_connected: "WordPress is not connected for this website.",
  wordpress_unhealthy:
    "WordPress connection is disconnected or missing credentials.",
  missing_article: "Article not found.",
};

export function canRollbackArticleViaWordPress(
  input: CanRollbackArticleViaWordPressInput
): CanRollbackArticleViaWordPressResult {
  const deny = (
    blockedReason: RollbackBlockedReason
  ): CanRollbackArticleViaWordPressResult => ({
    allowed: false,
    blockedReason,
    userSafeMessage: USER_SAFE[blockedReason],
  });

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

  if (article.status !== ArticleStatus.PUBLISHED) {
    return deny("article_not_published");
  }

  if (!article.wordpressPostId) {
    return deny("missing_wordpress_post_id");
  }

  if (!input.rankBoostPublishJobExists) {
    return deny("not_rankboost_published");
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

  return {
    allowed: true,
    blockedReason: null,
    userSafeMessage:
      "Rollback allowed — WordPress post will be moved to draft (not deleted).",
  };
}

export function buildWordPressRollbackIdempotencyKey(input: {
  articleId: string;
  wordpressPostId: string;
}): string {
  return `wordpress:rollback:article:${input.articleId}:post:${input.wordpressPostId}`;
}

export const RANKBOOST_PUBLISH_JOB_FILTER = {
  action: IntegrationExecutionAction.PUBLISH,
  status: IntegrationExecutionStatus.SUCCEEDED,
  provider: "WORDPRESS" as const,
};
