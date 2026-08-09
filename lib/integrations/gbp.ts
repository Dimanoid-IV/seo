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
  getBusinessProfileLocation,
  normalizeBusinessProfileId,
  type GoogleBusinessProfileLocation,
} from "@/lib/google/business-profile";
import { decryptSecret } from "@/lib/security/encryption";

export type GbpMetricsJson = {
  location: GoogleBusinessProfileLocation;
  syncedAt: string;
};

function validateBusinessProfileId(value: string, label: string): string {
  const normalized = normalizeBusinessProfileId(value);
  if (!/^[A-Za-z0-9_-]{3,128}$/.test(normalized)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${label} должен быть в формате Google Business Profile ID.`
    );
  }
  return normalized;
}

export async function connectGoogleBusinessProfileLocation(input: {
  websiteId: string;
  userId: string;
  accountId: string;
  locationId: string;
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

  const accountId = validateBusinessProfileId(input.accountId, "Account ID");
  const locationId = validateBusinessProfileId(input.locationId, "Location ID");

  const integration = await prisma.integration.upsert({
    where: {
      websiteId_provider: {
        websiteId: website.id,
        provider: IntegrationProvider.GOOGLE_BUSINESS_PROFILE,
      },
    },
    create: {
      websiteId: website.id,
      organizationId: website.organizationId,
      provider: IntegrationProvider.GOOGLE_BUSINESS_PROFILE,
      status: IntegrationStatus.CONNECTED,
      displayName: "Google Business Profile",
      scopesJson: { scope: "business.manage" },
    },
    update: {
      status: IntegrationStatus.CONNECTED,
      displayName: "Google Business Profile",
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
      businessProfileAccountId: accountId,
      businessProfileLocationId: locationId,
    },
    update: {
      siteUrl: website.url,
      businessProfileAccountId: accountId,
      businessProfileLocationId: locationId,
    },
  });

  return { integrationId: integration.id, accountId, locationId };
}

export async function syncGoogleBusinessProfileForWebsite(input: {
  websiteId: string;
  userId: string;
}): Promise<GbpMetricsJson> {
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

  const gbpIntegration = await prisma.integration.findFirst({
    where: {
      websiteId: website.id,
      provider: IntegrationProvider.GOOGLE_BUSINESS_PROFILE,
      status: IntegrationStatus.CONNECTED,
    },
    select: {
      id: true,
      googleData: {
        select: {
          businessProfileAccountId: true,
          businessProfileLocationId: true,
        },
      },
    },
  });
  const accountId = gbpIntegration?.googleData?.businessProfileAccountId?.trim();
  const locationId = gbpIntegration?.googleData?.businessProfileLocationId?.trim();
  if (!gbpIntegration || !accountId || !locationId) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Сначала укажите Google Business Profile account ID и location ID."
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

  const { withGscAccessToken } = await import("@/lib/integrations/gsc-access");
  const location = await withGscAccessToken(
    googleIntegration.id,
    accessToken,
    async (token) =>
      getBusinessProfileLocation({
        accessToken: token,
        accountId,
        locationId,
      })
  );
  const now = new Date();
  const metricsJson: GbpMetricsJson = {
    location,
    syncedAt: now.toISOString(),
  };

  await prisma.$transaction([
    prisma.googleIntegrationData.update({
      where: { integrationId: gbpIntegration.id },
      data: {
        siteUrl: website.url,
        businessProfileAccountId: accountId,
        businessProfileLocationId: locationId,
        metricsJson,
        lastFetchedAt: now,
      },
    }),
    prisma.integration.update({
      where: { id: gbpIntegration.id },
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
        title: "Google Business Profile обновлён",
        description: "RankBoost получил свежие данные карточки компании.",
        metadataJson: {
          provider: "google_business_profile",
          accountId,
          locationId,
          title: location.title,
        },
      },
    }),
  ]);

  return metricsJson;
}

export function extractGbpSummary(metricsJson: unknown): GoogleBusinessProfileLocation | null {
  if (!metricsJson || typeof metricsJson !== "object" || Array.isArray(metricsJson)) {
    return null;
  }
  const location = (metricsJson as { location?: unknown }).location;
  if (!location || typeof location !== "object" || Array.isArray(location)) {
    return null;
  }
  const record = location as Partial<Record<keyof GoogleBusinessProfileLocation, unknown>>;
  return {
    name: String(record.name ?? ""),
    title: typeof record.title === "string" ? record.title : null,
    websiteUri: typeof record.websiteUri === "string" ? record.websiteUri : null,
    primaryPhone: typeof record.primaryPhone === "string" ? record.primaryPhone : null,
    address: typeof record.address === "string" ? record.address : null,
    primaryCategory:
      typeof record.primaryCategory === "string" ? record.primaryCategory : null,
  };
}
