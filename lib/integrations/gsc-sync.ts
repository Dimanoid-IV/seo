import {
  IntegrationProvider,
  IntegrationStatus,
  WebsiteStatus,
} from "@prisma/client";
import { ActivityType } from "@prisma/client";

import { findPrimaryOrganization } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  getSearchConsolePerformance,
  getSearchConsolePerformanceRows,
  type SearchConsolePerformanceSummary,
} from "@/lib/google/search-console";
import { decryptSecret } from "@/lib/security/encryption";

import { getGscPerformanceDateRange } from "./gsc-metrics";
import { generateGscInsights } from "./gsc-insights";
import { findGscPageQueryOpportunities } from "./gsc-opportunities";
import { generateTasksFromGscInsights } from "./gsc-task-generator";
import type { GscMetricsJson } from "./gsc-types";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";
import { scoreKeywordOpportunity } from "@/lib/content-research/opportunity-score";

function inferIntent(keyword: string): "INFORMATIONAL" | "COMMERCIAL" | "TRANSACTIONAL" | "NAVIGATIONAL" | "LOCAL" | "MIXED" {
  const value = keyword.toLowerCase();
  if (/\b(buy|price|order|shop|osta|hind|заказать|купить|цена)\b/.test(value)) return "TRANSACTIONAL";
  if (/\b(best|compare|review|service|лучший|сравн|услуг)\b/.test(value)) return "COMMERCIAL";
  if (/\b(tallinn|estonia|eesti|near me|рядом|таллин)\b/.test(value)) return "LOCAL";
  if (/\b(how|what|why|guide|как|что|почему|kuidas|mis)\b/.test(value)) return "INFORMATIONAL";
  return "MIXED";
}

export type GscSyncResult = {
  period: GscMetricsJson["period"];
  summary: SearchConsolePerformanceSummary;
  syncedAt: string;
  tasksCreated: number;
  tasksCreatedLastSync: number;
};

type SyncGscPerformanceInput = {
  websiteId: string;
  userId: string;
};

/**
 * Imports GSC performance metrics for the last 28 days and persists them.
 */
export async function syncGscPerformanceForWebsite({
  websiteId,
  userId,
}: SyncGscPerformanceInput): Promise<GscSyncResult> {
  const prisma = getPrisma();

  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
      organization: {
        deletedAt: null,
        ownerUserId: userId,
      },
    },
    select: {
      id: true,
      url: true,
      organizationId: true,
    },
  });

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");
  }

  const integration = await prisma.integration.findFirst({
    where: {
      websiteId: website.id,
      provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      status: IntegrationStatus.CONNECTED,
    },
    select: {
      id: true,
      accessTokenEncrypted: true,
      googleData: {
        select: {
          id: true,
          searchConsoleSiteUrl: true,
        },
      },
    },
  });

  if (!integration?.accessTokenEncrypted) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Google Search Console не подключён для этого сайта"
    );
  }

  const searchConsoleSiteUrl =
    integration.googleData?.searchConsoleSiteUrl?.trim();

  if (!searchConsoleSiteUrl) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Сначала выберите сайт в Google Search Console"
    );
  }

  let accessToken: string;
  try {
    accessToken = decryptSecret(integration.accessTokenEncrypted);
  } catch (error) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      "Не удалось расшифровать токен Google Search Console",
      { cause: error }
    );
  }

  const period = getGscPerformanceDateRange(28);
  const { withGscAccessToken } = await import("@/lib/integrations/gsc-access");
  const [summary, pages, queries, pageQueries, dailyPages] = await withGscAccessToken(
    integration.id,
    accessToken,
    async (token) =>
      Promise.all([
        getSearchConsolePerformance({
          accessToken: token,
          siteUrl: searchConsoleSiteUrl,
          startDate: period.startDate,
          endDate: period.endDate,
        }),
        getSearchConsolePerformanceRows({
          accessToken: token,
          siteUrl: searchConsoleSiteUrl,
          startDate: period.startDate,
          endDate: period.endDate,
          dimensions: ["page"],
          rowLimit: 50,
        }),
        getSearchConsolePerformanceRows({
          accessToken: token,
          siteUrl: searchConsoleSiteUrl,
          startDate: period.startDate,
          endDate: period.endDate,
          dimensions: ["query"],
          rowLimit: 50,
        }),
        getSearchConsolePerformanceRows({
        accessToken: token,
        siteUrl: searchConsoleSiteUrl,
        startDate: period.startDate,
        endDate: period.endDate,
          dimensions: ["page", "query"],
          rowLimit: 100,
        }),
        getSearchConsolePerformanceRows({
          accessToken: token,
          siteUrl: searchConsoleSiteUrl,
          startDate: period.startDate,
          endDate: period.endDate,
          dimensions: ["date", "page", "country", "device"],
          rowLimit: 5_000,
        }),
      ])
  );

  const syncedAt = new Date().toISOString();
  const insights = generateGscInsights(summary);
  const pageQueryOpportunities = findGscPageQueryOpportunities({
    period,
    pageQueries,
  });
  const now = new Date();
  let tasksCreated = 0;

  await prisma.$transaction(async (tx) => {
    await tx.googleIntegrationData.upsert({
      where: { integrationId: integration.id },
      create: {
        integrationId: integration.id,
        searchConsoleSiteUrl,
        siteUrl: website.url,
        metricsJson: {
          period,
          summary,
          pages,
          queries,
          pageQueries,
          syncedAt,
        },
        lastFetchedAt: now,
      },
      update: {
        lastFetchedAt: now,
      },
    });

    const taskResult = await generateTasksFromGscInsights({
      websiteId: website.id,
      organizationId: website.organizationId,
      userId,
      metricsSummary: summary,
      insights,
      pageQueryOpportunities,
      tx,
    });
    tasksCreated = taskResult.tasksCreated;

    const metricsJson: GscMetricsJson = {
      period,
      summary,
      pages,
      queries,
      pageQueries,
      syncedAt,
      tasksCreatedLastSync: tasksCreated,
    };

    await tx.googleIntegrationData.update({
      where: { integrationId: integration.id },
      data: { metricsJson },
    });

    if (dailyPages.length > 0) {
      await tx.pageMetric.createMany({
        data: dailyPages.flatMap((row) =>
          row.date && row.page
            ? [{
                websiteId: website.id,
                pageUrl: row.page,
                date: new Date(`${row.date}T00:00:00.000Z`),
                country: row.country ?? "all",
                device: row.device ?? "all",
                impressions: Math.round(row.impressions),
                clicks: Math.round(row.clicks),
                ctr: row.ctr,
                position: row.position,
              }]
            : []
        ),
        skipDuplicates: true,
      });
    }

    for (const row of pageQueries) {
      if (!row.query) continue;
      const normalizedKeyword = row.query.trim().toLocaleLowerCase();
      const intent = inferIntent(row.query);
      const recommendedAction =
        row.position <= 10 && row.ctr < 0.02
          ? "CHANGE_META"
          : row.position >= 8 && row.position <= 20
            ? "UPDATE_EXISTING"
            : "ADD_SECTION";
      const keyword = await tx.keyword.upsert({
        where: {
          websiteId_normalizedKeyword_locale_country: {
            websiteId: website.id,
            normalizedKeyword,
            locale: "und",
            country: "all",
          },
        },
        create: {
          websiteId: website.id,
          organizationId: website.organizationId,
          keyword: row.query,
          normalizedKeyword,
          locale: "und",
          country: "all",
          intent,
          relevance: 0.75,
          businessValue: intent === "TRANSACTIONAL" || intent === "COMMERCIAL" ? 0.9 : 0.6,
          opportunityScore: scoreKeywordOpportunity({
            relevance: 0.75,
            intentValue: intent === "TRANSACTIONAL" || intent === "COMMERCIAL" ? 0.9 : 0.6,
            achievableProbability: row.position > 0 && row.position <= 20 ? 0.85 : 0.45,
            trafficPotential: Math.min(row.impressions / 500, 1),
            businessValue: intent === "TRANSACTIONAL" || intent === "COMMERCIAL" ? 0.9 : 0.6,
            freshnessOpportunity: 0.7,
            evidenceConfidence: 1,
          }),
          confidence: 1,
          rankingUrl: row.page,
          currentPosition: row.position,
          impressions: Math.round(row.impressions),
          clicks: Math.round(row.clicks),
          ctr: row.ctr,
          recommendedAction,
          evidenceJson: [{ source: "GSC", period, page: row.page }],
          lastEvaluatedAt: now,
        },
        update: {
          intent,
          rankingUrl: row.page,
          currentPosition: row.position,
          impressions: Math.round(row.impressions),
          clicks: Math.round(row.clicks),
          ctr: row.ctr,
          recommendedAction,
          lastEvaluatedAt: now,
        },
        select: { id: true },
      });
      await tx.keywordMetric.createMany({
        data: [{
          keywordId: keyword.id,
          date: new Date(`${period.endDate}T00:00:00.000Z`),
          pageUrl: row.page ?? "",
          country: "all",
          device: "all",
          impressions: Math.round(row.impressions),
          clicks: Math.round(row.clicks),
          ctr: row.ctr,
          position: row.position,
        }],
        skipDuplicates: true,
      });
    }

    await tx.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: now,
        lastSuccessAt: now,
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });

    await tx.activity.create({
      data: {
        organizationId: website.organizationId,
        websiteId: website.id,
        userId,
        type: ActivityType.SYSTEM_NOTICE,
        title: "Данные Google Search Console обновлены",
        description: "RankBoost получил свежие данные из Google.",
        metadataJson: {
          provider: "google_search_console",
          period,
          summary,
          tasksCreated,
        },
      },
    });
  });

  try {
    await syncGrowthOpportunitiesForWebsite({
      websiteId: website.id,
      organizationId: website.organizationId,
      userId,
    });
  } catch {
    // Growth sync must not block GSC sync.
  }

  try {
    const { timelineAfterGscInsights } = await import("@/lib/timeline/hooks");
    await timelineAfterGscInsights({
      userId,
      websiteId: website.id,
      insights,
    });
  } catch {
    // Timeline sync must not block GSC sync.
  }

  return {
    period,
    summary,
    syncedAt,
    tasksCreated,
    tasksCreatedLastSync: tasksCreated,
  };
}

/**
 * Resolves website id for GSC sync — uses active website when not provided.
 */
export async function resolveWebsiteIdForGscSync(
  userId: string,
  organizationId: string | null,
  websiteId?: string | null
): Promise<string> {
  const prisma = getPrisma();

  let organization = organizationId
    ? await prisma.organization.findFirst({
        where: {
          id: organizationId,
          deletedAt: null,
          ownerUserId: userId,
        },
        select: { id: true },
      })
    : null;

  if (!organization) {
    organization = await findPrimaryOrganization(prisma, userId);
  }

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Организация не найдена");
  }

  if (websiteId) {
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        organizationId: organization.id,
        deletedAt: null,
        status: WebsiteStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!website) {
      throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");
    }

    return website.id;
  }

  const website = await prisma.website.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!website) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Добавьте сайт, чтобы синхронизировать Google Search Console"
    );
  }

  return website.id;
}
