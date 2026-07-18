/**
 * Pure article-quota policy (no DB / no server-only).
 * See article-usage.ts for the live DB counter and reconciliation.
 *
 * ARTICLE_DRAFT (product limit) = usable active drafts this month.
 * AI_GENERATION (cost protection) stays as a separate persisted attempt counter.
 */

import { ArticleStatus } from "@prisma/client";

export type ArticleQuotaRow = {
  id: string;
  status: ArticleStatus | string;
  qualityPassed: boolean | null;
  deletedAt: Date | null;
  createdAt: Date;
  generatedByAIJobId: string | null;
};

/** Statuses that still occupy a usable article slot for the month. */
export const ARTICLE_QUOTA_ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  ArticleStatus.DRAFT,
  ArticleStatus.WAITING_REVIEW,
  ArticleStatus.APPROVED,
  ArticleStatus.WORDPRESS_DRAFT_CREATED,
  ArticleStatus.PUBLISHED,
]);

/** Statuses that never count toward the usable article quota. */
export const ARTICLE_QUOTA_EXCLUDED_STATUSES: ReadonlySet<string> = new Set([
  ArticleStatus.ARCHIVED,
  ArticleStatus.FAILED,
  ArticleStatus.IDEA,
]);

export function monthKeyToPeriod(month: string): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})$/.exec(month.trim());
  if (!match) {
    throw new Error(`Invalid month key: ${month}`);
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { start, end };
}

export function currentArticleUsageMonthKey(now = new Date()): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

/**
 * Pure predicate — safe for unit tests without a DB.
 * Failed-quality DRAFTs and archived/failed/idea/soft-deleted rows do not count.
 */
export function isArticleCountedTowardQuota(article: ArticleQuotaRow): boolean {
  if (article.deletedAt) {
    return false;
  }

  if (!article.generatedByAIJobId) {
    return false;
  }

  const status = String(article.status);
  if (ARTICLE_QUOTA_EXCLUDED_STATUSES.has(status)) {
    return false;
  }

  if (!ARTICLE_QUOTA_ACTIVE_STATUSES.has(status)) {
    return false;
  }

  // Quality-failed drafts cannot be approved — do not permanently occupy quota.
  if (status === ArticleStatus.DRAFT && article.qualityPassed === false) {
    return false;
  }

  return true;
}

export function countActiveQuotaArticleDraftsFromRows(
  articles: ArticleQuotaRow[],
  month: string
): number {
  const { start, end } = monthKeyToPeriod(month);
  return articles.filter((article) => {
    if (article.createdAt < start || article.createdAt >= end) {
      return false;
    }
    return isArticleCountedTowardQuota(article);
  }).length;
}
