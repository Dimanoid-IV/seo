/**
 * Live-derived ARTICLE_DRAFT usage (Prompt 11.41).
 *
 * Product-facing article quota = usable active drafts (see article-usage-policy).
 * Cost protection remains on AI_GENERATION (persisted attempt counter).
 */

import "server-only";

import { ArticleStatus, type PrismaClient } from "@prisma/client";

import { getPrisma } from "@/lib/db";

import {
  ARTICLE_QUOTA_ACTIVE_STATUSES,
  countActiveQuotaArticleDraftsFromRows,
  currentArticleUsageMonthKey,
  monthKeyToPeriod,
  type ArticleQuotaRow,
} from "./article-usage-policy";

export {
  ARTICLE_QUOTA_ACTIVE_STATUSES,
  ARTICLE_QUOTA_EXCLUDED_STATUSES,
  countActiveQuotaArticleDraftsFromRows,
  currentArticleUsageMonthKey,
  isArticleCountedTowardQuota,
  monthKeyToPeriod,
  type ArticleQuotaRow,
} from "./article-usage-policy";

export type CountActiveQuotaArticleDraftsInput = {
  organizationId: string;
  websiteId?: string | null;
  month?: string;
  /** Optional Prisma client (tests / transactions). */
  prisma?: Pick<PrismaClient, "article">;
};

/**
 * Live count of usable active article drafts for the org in the given UTC month.
 * Prefer this over persisted ARTICLE_DRAFT counters for limit checks and UI.
 */
export async function countActiveQuotaArticleDrafts(
  input: CountActiveQuotaArticleDraftsInput
): Promise<number> {
  const prisma = input.prisma ?? getPrisma();
  const month = input.month ?? currentArticleUsageMonthKey();
  const { start, end } = monthKeyToPeriod(month);

  const articles = await prisma.article.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.websiteId ? { websiteId: input.websiteId } : {}),
      deletedAt: null,
      generatedByAIJobId: { not: null },
      createdAt: { gte: start, lt: end },
      status: { in: [...ARTICLE_QUOTA_ACTIVE_STATUSES] as ArticleStatus[] },
      NOT: {
        AND: [{ status: ArticleStatus.DRAFT }, { qualityPassed: false }],
      },
    },
    select: { id: true },
  });

  return articles.length;
}

/**
 * Syncs the persisted ARTICLE_DRAFT usageCounter (and optional planLimit.articlesUsed)
 * to the live usable-draft count. Idempotent — safe to call repeatedly.
 * Does not delete articles.
 */
export async function reconcileArticleDraftUsage(input: {
  userId: string;
  organizationId: string;
  websiteId?: string | null;
  month?: string;
  /** When set, also snaps planLimit.articlesUsed to the live count. */
  planLimitId?: string | null;
}): Promise<{ liveCount: number; month: string }> {
  const prisma = getPrisma();
  const month = input.month ?? currentArticleUsageMonthKey();
  const liveCount = await countActiveQuotaArticleDrafts({
    organizationId: input.organizationId,
    // Org-wide usable slots match how generation asserts limits today.
    websiteId: null,
    month,
  });

  await prisma.usageCounter.upsert({
    where: {
      organizationId_userId_month_key: {
        organizationId: input.organizationId,
        userId: input.userId,
        month,
        key: "ARTICLE_DRAFT",
      },
    },
    create: {
      userId: input.userId,
      organizationId: input.organizationId,
      websiteId: input.websiteId ?? null,
      month,
      key: "ARTICLE_DRAFT",
      count: liveCount,
    },
    update: {
      count: liveCount,
      ...(input.websiteId ? { websiteId: input.websiteId } : {}),
    },
  });

  if (input.planLimitId) {
    await prisma.planLimit.update({
      where: { id: input.planLimitId },
      data: { articlesUsed: liveCount },
    });
  }

  return { liveCount, month };
}

/** Test helper: re-export row counter with an explicit name used in Prompt 11.41. */
export function countActiveQuotaArticleDraftsPure(
  articles: ArticleQuotaRow[],
  month: string
): number {
  return countActiveQuotaArticleDraftsFromRows(articles, month);
}
