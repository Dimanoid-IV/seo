import { IntegrationStatus, WebsiteStatus } from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

import {
  INTEGRATION_CATALOG,
  mapIntegrationDbStatus,
} from "./catalog";
import { extractGscMetricsSummary } from "./gsc-metrics";
import type { IntegrationsOverviewResponse } from "./types";
import {
  getWordPressConnection,
  mapWordPressConnectionStatus,
} from "./wordpress-connector";
import { isHermesConfigured } from "@/lib/hermes/client";

/**
 * Loads integrations hub overview: catalog merged with DB Integration rows.
 */
export async function getIntegrationsOverview(
  currentUser: CurrentUser
): Promise<IntegrationsOverviewResponse> {
  const prisma = getPrisma();

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  const emptyIntegrations = INTEGRATION_CATALOG.map((item) => {
    if (item.provider === "hermes_ai") {
      const configured = isHermesConfigured();
      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        connected: configured,
        status: configured ? "Configured" : "Not configured",
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt: null,
        lastSyncAt: null,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
        platformManaged: true,
        hermesConfigured: configured,
      };
    }

    const mapped = mapIntegrationDbStatus(undefined);
    return {
      provider: item.provider,
      title: item.title,
      description: item.description,
      connected: mapped.connected,
      status: mapped.status,
      available: item.available,
      comingSoon: item.comingSoon,
      connectedAt: null,
      lastSyncAt: null,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
    };
  });

  if (!organization) {
    return {
      data: {
        website: null,
        integrations: emptyIntegrations,
      },
    };
  }

  const website = await prisma.website.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true },
  });

  if (!website) {
    return {
      data: {
        website: null,
        integrations: emptyIntegrations,
      },
    };
  }

  const dbIntegrations = await prisma.integration.findMany({
    where: { websiteId: website.id },
    select: {
      provider: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      lastSyncAt: true,
      lastSuccessAt: true,
      lastErrorAt: true,
      lastErrorMessage: true,
      googleData: {
        select: {
          searchConsoleSiteUrl: true,
          metricsJson: true,
          lastFetchedAt: true,
        },
      },
    },
  });

  const dbByProvider = new Map(
    dbIntegrations.map((record) => [record.provider, record])
  );

  const wordpressConnection = await getWordPressConnection({
    websiteId: website.id,
  });

  const integrations = INTEGRATION_CATALOG.map((item) => {
    if (item.provider === "hermes_ai") {
      const configured = isHermesConfigured();
      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        connected: configured,
        status: configured ? "Configured" : "Not configured",
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt: null,
        lastSyncAt: null,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
        platformManaged: true,
        hermesConfigured: configured,
      };
    }

    const record = item.dbProvider
      ? dbByProvider.get(item.dbProvider)
      : undefined;
    const mapped = mapIntegrationDbStatus(record?.status);

    if (item.provider === "wordpress") {
      const wpMapped = wordpressConnection
        ? mapWordPressConnectionStatus(wordpressConnection.status)
        : null;
      const integrationConnected =
        record?.status === IntegrationStatus.CONNECTED;
      const connected =
        wpMapped?.connected === true || integrationConnected === true;
      const statusLabel =
        wpMapped?.label ??
        (integrationConnected ? "Connected" : mapped.status);

      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        connected,
        status: statusLabel,
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt:
          connected && (wordpressConnection || record)
            ? (wordpressConnection?.updatedAt ?? record?.updatedAt)?.toISOString() ??
              null
            : null,
        lastSyncAt: wordpressConnection?.lastPingAt?.toISOString() ?? null,
        lastSuccessAt: record?.lastSuccessAt?.toISOString() ?? null,
        lastErrorAt: record?.lastErrorAt?.toISOString() ?? null,
        lastErrorMessage: record?.lastErrorMessage ?? null,
        wordpress: wordpressConnection
          ? {
              connectionStatus: wordpressConnection.status,
              siteUrl: wordpressConnection.siteUrl,
              pluginVersion: wordpressConnection.pluginVersion,
              lastPingAt: wordpressConnection.lastPingAt?.toISOString() ?? null,
              permissions: wordpressConnection.permissions,
            }
          : null,
      };
    }

    return {
      provider: item.provider,
      title: item.title,
      description: item.description,
      connected: mapped.connected,
      status: mapped.status,
      available: item.available,
      comingSoon: item.comingSoon,
      connectedAt:
        mapped.connected && record
          ? record.updatedAt.toISOString()
          : null,
      lastSyncAt: record?.lastSyncAt?.toISOString() ?? null,
      lastSuccessAt: record?.lastSuccessAt?.toISOString() ?? null,
      lastErrorAt: record?.lastErrorAt?.toISOString() ?? null,
      lastErrorMessage: record?.lastErrorMessage ?? null,
      ...(item.provider === "google_search_console"
        ? {
            selectedProperty: mapped.connected
              ? (record?.googleData?.searchConsoleSiteUrl ?? null)
              : null,
            metricsSummary: mapped.connected
              ? extractGscMetricsSummary(record?.googleData?.metricsJson)
              : null,
            lastFetchedAt:
              record?.googleData?.lastFetchedAt?.toISOString() ?? null,
          }
        : {}),
    };
  });

  return {
    data: {
      website: { id: website.id, url: website.url },
      integrations,
    },
  };
}
