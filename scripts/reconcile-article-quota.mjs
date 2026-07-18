/**
 * Production reconciliation for ARTICLE_DRAFT (Prompt 11.41).
 * Snaps the persisted usage counter + planLimit.articlesUsed to the live
 * usable-active-draft count. Does not delete articles. No Hermes calls.
 *
 * Usage (with DATABASE_URL pointing at the target DB):
 *   set -a && source .env.local && set +a && ./node_modules/.bin/tsx scripts/reconcile-article-quota.mjs
 */
import { pathToFileURL } from "node:url";
import path from "node:path";

const load = (rel) =>
  import(pathToFileURL(path.join(process.cwd(), rel)).href);

const userId = process.argv[2] || "61e2d0aa-1c3d-48d0-8520-900dca3aef4e";
const organizationId =
  process.argv[3] || "e418a366-67bb-4e05-b27c-c80226b5f48f";
const websiteId = process.argv[4] || "ab7c514d-0e09-41fc-b0da-845479c6c382";
const month = process.argv[5] || "2026-07";

const { getPrisma } = await load("lib/db.ts");
const {
  countActiveQuotaArticleDrafts,
  reconcileArticleDraftUsage,
} = await load("lib/billing/article-usage.ts");

const prisma = getPrisma();

const beforeCounter = await prisma.usageCounter.findFirst({
  where: { organizationId, userId, month, key: "ARTICLE_DRAFT" },
  select: { count: true },
});

const liveBefore = await countActiveQuotaArticleDrafts({
  organizationId,
  month,
});

const planLimit = await prisma.planLimit.findFirst({
  where: { organizationId },
  orderBy: { periodStart: "desc" },
  select: { id: true, articlesUsed: true, articlesLimit: true },
});

const result = await reconcileArticleDraftUsage({
  userId,
  organizationId,
  websiteId,
  month,
  planLimitId: planLimit?.id ?? null,
});

const afterCounter = await prisma.usageCounter.findFirst({
  where: { organizationId, userId, month, key: "ARTICLE_DRAFT" },
  select: { count: true },
});

const afterPlanLimit = planLimit
  ? await prisma.planLimit.findUnique({
      where: { id: planLimit.id },
      select: { articlesUsed: true, articlesLimit: true },
    })
  : null;

const { start, end } = (() => {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
})();

const julyArticles = await prisma.article.findMany({
  where: {
    organizationId,
    deletedAt: null,
    createdAt: { gte: start, lt: end },
  },
  select: {
    id: true,
    status: true,
    qualityPassed: true,
    title: true,
  },
  orderBy: { createdAt: "asc" },
});

console.log(
  JSON.stringify(
    {
      reconciled: true,
      month: result.month,
      beforeCounter: beforeCounter?.count ?? null,
      liveBefore,
      afterCounter: afterCounter?.count ?? null,
      liveAfter: result.liveCount,
      planLimitBefore: planLimit
        ? {
            articlesUsed: planLimit.articlesUsed,
            articlesLimit: planLimit.articlesLimit,
          }
        : null,
      planLimitAfter: afterPlanLimit,
      julyArticles: julyArticles.map((a) => ({
        id: a.id,
        status: a.status,
        qualityPassed: a.qualityPassed,
        title: a.title.slice(0, 80),
      })),
    },
    null,
    2
  )
);
