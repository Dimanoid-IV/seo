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
  type SearchConsolePerformanceSummary,
} from "@/lib/google/search-console";
import { decryptSecret } from "@/lib/security/encryption";

import { getGscPerformanceDateRange } from "./gsc-metrics";
import { generateGscInsights } from "./gsc-insights";
import { generateTasksFromGscInsights } from "./gsc-task-generator";
import type { GscMetricsJson } from "./gsc-types";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";

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

function integrationErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Google Search Console sync failed.";
}

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
  let summary: SearchConsolePerformanceSummary;

  try {
    summary = await withGscAccessToken(
      integration.id,
      accessToken,
      (token) =>
        getSearchConsolePerformance({
          accessToken: token,
          siteUrl: searchConsoleSiteUrl,
          startDate: period.startDate,
          endDate: period.endDate,
        })
    );
  } catch (error) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastErrorAt: new Date(),
        lastErrorMessage: integrationErrorMessage(error),
      },
    });
    throw error;
  }

  const syncedAt = new Date().toISOString();
  const insights = generateGscInsights(summary);
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
      tx,
    });
    tasksCreated = taskResult.tasksCreated;

    const metricsJson: GscMetricsJson = {
      period,
      summary,
      syncedAt,
      tasksCreatedLastSync: tasksCreated,
    };

    await tx.googleIntegrationData.update({
      where: { integrationId: integration.id },
      data: { metricsJson },
    });

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
