import "server-only";

import {
  ActivityType,
  IntegrationProvider,
  IntegrationStatus,
  WebsiteStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  getGa4Summary,
  getGa4TopPages,
  type Ga4DateRange,
  type Ga4PageRow,
  type Ga4Summary,
} from "@/lib/google/analytics";
import { decryptSecret } from "@/lib/security/encryption";

export type Ga4MetricsJson = {
  period: Ga4DateRange;
  summary: Ga4Summary;
  topPages: Ga4PageRow[];
  syncedAt: string;
};

export function getGa4DateRange(days = 28): Ga4DateRange {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function normalizePropertyId(value: string): string {
  return value.trim().replace(/^properties\//, "");
}

export async function connectGa4Property(input: {
  websiteId: string;
  userId: string;
  propertyId: string;
}) {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: {
      id: input.websiteId,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
      organization: { ownerUserId: input.userId, deletedAt: null },
    },
    select: { id: true, url: true, organizationId: true },
  });
  if (!website) throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");

  const propertyId = normalizePropertyId(input.propertyId);
  if (!/^\d{4,32}$/.test(propertyId)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Укажите GA4 property ID в числовом формате."
    );
  }

  const integration = await prisma.integration.upsert({
    where: {
      websiteId_provider: {
        websiteId: website.id,
        provider: IntegrationProvider.GOOGLE_ANALYTICS,
      },
    },
    create: {
      websiteId: website.id,
      organizationId: website.organizationId,
      provider: IntegrationProvider.GOOGLE_ANALYTICS,
      status: IntegrationStatus.CONNECTED,
      displayName: "Google Analytics 4",
      scopesJson: { scope: "analytics.readonly" },
    },
    update: {
      status: IntegrationStatus.CONNECTED,
      displayName: "Google Analytics 4",
      disconnectedAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
    },
    select: { id: true },
  });

  await prisma.googleIntegrationData.upsert({
    where: { integrationId: integration.id },
    create: {
      integrationId: integration.id,
      siteUrl: website.url,
      analyticsPropertyId: propertyId,
    },
    update: {
      siteUrl: website.url,
      analyticsPropertyId: propertyId,
    },
  });

  return { integrationId: integration.id, propertyId };
}

export async function syncGa4ForWebsite(input: {
  websiteId: string;
  userId: string;
}): Promise<Ga4MetricsJson> {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: {
      id: input.websiteId,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
      organization: { ownerUserId: input.userId, deletedAt: null },
    },
    select: { id: true, url: true, organizationId: true },
  });
  if (!website) throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");

  const gaIntegration = await prisma.integration.findFirst({
    where: {
      websiteId: website.id,
      provider: IntegrationProvider.GOOGLE_ANALYTICS,
      status: IntegrationStatus.CONNECTED,
    },
    select: {
      id: true,
      googleData: { select: { analyticsPropertyId: true } },
    },
  });
  const propertyId = gaIntegration?.googleData?.analyticsPropertyId?.trim();
  if (!gaIntegration || !propertyId) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Сначала укажите Google Analytics property ID."
    );
  }

  const googleIntegration = await prisma.integration.findFirst({
    where: {
      websiteId: website.id,
      provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      status: IntegrationStatus.CONNECTED,
    },
    select: { id: true, accessTokenEncrypted: true },
  });
  if (!googleIntegration?.accessTokenEncrypted) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Сначала подключите Google аккаунт через Search Console."
    );
  }

  let accessToken: string;
  try {
    accessToken = decryptSecret(googleIntegration.accessTokenEncrypted);
  } catch (error) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      "Не удалось расшифровать Google access token.",
      { cause: error }
    );
  }

  const period = getGa4DateRange(28);
  const { withGscAccessToken } = await import("@/lib/integrations/gsc-access");
  const [summary, topPages] = await withGscAccessToken(
    googleIntegration.id,
    accessToken,
    async (token) =>
      Promise.all([
        getGa4Summary({ accessToken: token, propertyId, period }),
        getGa4TopPages({ accessToken: token, propertyId, period, rowLimit: 25 }),
      ])
  );
  const metricsJson: Ga4MetricsJson = {
    period,
    summary,
    topPages,
    syncedAt: new Date().toISOString(),
  };
  const now = new Date();

  await prisma.$transaction([
    prisma.googleIntegrationData.update({
      where: { integrationId: gaIntegration.id },
      data: {
        siteUrl: website.url,
        analyticsPropertyId: propertyId,
        metricsJson,
        lastFetchedAt: now,
      },
    }),
    prisma.integration.update({
      where: { id: gaIntegration.id },
      data: {
        lastSyncAt: now,
        lastSuccessAt: now,
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    }),
    prisma.activity.create({
      data: {
        organizationId: website.organizationId,
        websiteId: website.id,
        userId: input.userId,
        type: ActivityType.SYSTEM_NOTICE,
        title: "Данные Google Analytics обновлены",
        description: "RankBoost получил свежие данные GA4.",
        metadataJson: {
          provider: "google_analytics",
          period,
          summary,
        },
      },
    }),
  ]);

  return metricsJson;
}

export function extractGa4Summary(metricsJson: unknown): Ga4Summary | null {
  if (!metricsJson || typeof metricsJson !== "object" || Array.isArray(metricsJson)) {
    return null;
  }
  const summary = (metricsJson as { summary?: unknown }).summary;
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return null;
  }
  const record = summary as Partial<Record<keyof Ga4Summary, unknown>>;
  return {
    activeUsers: Number(record.activeUsers ?? 0),
    sessions: Number(record.sessions ?? 0),
    screenPageViews: Number(record.screenPageViews ?? 0),
    conversions: Number(record.conversions ?? 0),
    engagementRate: Number(record.engagementRate ?? 0),
  };
}
