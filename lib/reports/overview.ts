import {
  AuditStatus,
  TaskStatus,
  WebsiteStatus,
} from "@prisma/client";

import { resolveOwnedOrganization, monthPeriod } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

import type { ReportsOverviewResponse } from "./types";

const ARTICLE_ACTIVITY_TYPES = new Set([
  "ARTICLE_CREATED",
  "ARTICLE_DRAFT_CREATED",
  "ARTICLE_VALIDATED",
  "ARTICLE_REPAIRED",
]);

type ActivityWithMetadata = {
  id: string;
  type: string;
  metadataJson: unknown;
};

function extractArticleId(metadataJson: unknown): string | null {
  if (
    metadataJson &&
    typeof metadataJson === "object" &&
    "articleId" in metadataJson
  ) {
    const value = (metadataJson as { articleId?: unknown }).articleId;
    return typeof value === "string" && value.length > 0 ? value : null;
  }
  return null;
}

/**
 * Returns the set of activity ids that reference an article which is no longer
 * active (archived, failed or soft-deleted). These should not be surfaced as
 * current/recommended activity even though we keep the historical row.
 */
async function resolveArchivedActivityIds(
  prisma: ReturnType<typeof getPrisma>,
  activities: ActivityWithMetadata[]
): Promise<Set<string>> {
  const articleIdByActivity = new Map<string, string>();
  for (const activity of activities) {
    if (!ARTICLE_ACTIVITY_TYPES.has(activity.type)) {
      continue;
    }
    const articleId = extractArticleId(activity.metadataJson);
    if (articleId) {
      articleIdByActivity.set(activity.id, articleId);
    }
  }

  const articleIds = [...new Set(articleIdByActivity.values())];
  if (articleIds.length === 0) {
    return new Set();
  }

  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, status: true, deletedAt: true },
  });

  const inactiveArticleIds = new Set(
    articles
      .filter(
        (article) =>
          article.deletedAt !== null ||
          article.status === "ARCHIVED" ||
          article.status === "FAILED"
      )
      .map((article) => article.id)
  );

  // Also treat activities whose referenced article no longer exists as archived,
  // so deleted drafts don't look like current activity.
  const existingArticleIds = new Set(articles.map((article) => article.id));

  const archivedActivityIds = new Set<string>();
  for (const [activityId, articleId] of articleIdByActivity) {
    if (
      inactiveArticleIds.has(articleId) ||
      !existingArticleIds.has(articleId)
    ) {
      archivedActivityIds.add(activityId);
    }
  }

  return archivedActivityIds;
}

/**
 * Loads reports overview for the authenticated user's primary website.
 */
export async function getReportsOverview(
  currentUser: CurrentUser
): Promise<ReportsOverviewResponse> {
  const prisma = getPrisma();
  const { start: monthStart, end: monthEnd } = monthPeriod();

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  const emptyResponse = (): ReportsOverviewResponse => ({
    data: {
      website: null,
      latestAudit: null,
      growthHistory: [],
      taskStats: { completedThisMonth: 0, activeCount: 0 },
      lastActivities: [],
      reports: [],
    },
  });

  if (!organization) {
    return emptyResponse();
  }

  const website = await prisma.website.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      currentGrowthScore: true,
      lastAuditAt: true,
    },
  });

  const lastActivities = await prisma.activity.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      createdAt: true,
      metadataJson: true,
    },
  });

  const archivedActivityIds = await resolveArchivedActivityIds(
    prisma,
    lastActivities
  );

  if (!website) {
    return {
      data: {
        website: null,
        latestAudit: null,
        growthHistory: [],
        taskStats: { completedThisMonth: 0, activeCount: 0 },
        lastActivities: lastActivities.map((activity) => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          createdAt: activity.createdAt.toISOString(),
          archived: archivedActivityIds.has(activity.id),
        })),
        reports: [],
      },
    };
  }

  const latestAudit = await prisma.audit.findFirst({
    where: {
      websiteId: website.id,
      status: AuditStatus.COMPLETED,
      deletedAt: null,
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      growthScore: true,
      completedAt: true,
    },
  });

  const growthHistoryRaw = await prisma.growthScoreSnapshot.findMany({
    where: { websiteId: website.id },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      score: true,
      previousScore: true,
      delta: true,
      reason: true,
      source: true,
      createdAt: true,
    },
  });

  const growthHistory = [...growthHistoryRaw].reverse().map((snapshot) => ({
    id: snapshot.id,
    score: snapshot.score,
    previousScore: snapshot.previousScore,
    delta: snapshot.delta,
    reason: snapshot.reason,
    source: snapshot.source,
    createdAt: snapshot.createdAt.toISOString(),
  }));

  const [completedThisMonth, activeCount] = await Promise.all([
    prisma.task.count({
      where: {
        websiteId: website.id,
        deletedAt: null,
        status: TaskStatus.COMPLETED,
        completedAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    }),
    prisma.task.count({
      where: {
        websiteId: website.id,
        deletedAt: null,
        status: {
          in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS],
        },
      },
    }),
  ]);

  const reports = await prisma.report.findMany({
    where: { websiteId: website.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      summary: true,
      periodStart: true,
      periodEnd: true,
      createdAt: true,
    },
  });

  return {
    data: {
      website: {
        id: website.id,
        url: website.url,
        currentGrowthScore: website.currentGrowthScore,
        lastAuditAt: website.lastAuditAt?.toISOString() ?? null,
      },
      latestAudit: latestAudit
        ? {
            id: latestAudit.id,
            type: latestAudit.type.toLowerCase(),
            status: latestAudit.status.toLowerCase(),
            growthScore: latestAudit.growthScore,
            completedAt: latestAudit.completedAt?.toISOString() ?? null,
          }
        : null,
      growthHistory,
      taskStats: {
        completedThisMonth,
        activeCount,
      },
      lastActivities: lastActivities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt.toISOString(),
        archived: archivedActivityIds.has(activity.id),
      })),
      reports: reports.map((report) => ({
        id: report.id,
        type: report.type.toLowerCase(),
        status: report.status.toLowerCase(),
        title: report.title,
        summary: report.summary,
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
        createdAt: report.createdAt.toISOString(),
      })),
    },
  };
}
