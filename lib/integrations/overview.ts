import { IntegrationStatus, WebsiteStatus } from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

import {
  INTEGRATION_CATALOG,
  mapIntegrationDbStatus,
} from "./catalog";
import { extractGscMetricsSummary } from "./gsc-metrics";
import { resolveGscConnectionState } from "./gsc-state";
import type { IntegrationsOverviewResponse } from "./types";
import {
  getWordPressConnection,
  mapWordPressConnectionStatus,
} from "./wordpress-connector";
import { isHermesConfigured } from "@/lib/hermes/client";
import { getCustomPublishingConfig } from "@/lib/publishing/custom-webhook-config";
import { buildCustomPublishingDisplayState } from "@/lib/publishing/custom-publishing-display";
import { getGitHubPrConfig } from "@/lib/publishing/github-pr-config";
import { getShopifyPublishingConfig } from "@/lib/publishing/shopify-config";
import { getWebflowPublishingConfig } from "@/lib/publishing/webflow-config";

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
        category: item.category,
        capabilities: item.capabilities,
        connected: configured,
        status: configured ? "Configured" : "Not configured",
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt: null,
        lastSyncAt: null,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
        platformManaged: item.platformManaged ?? true,
        hermesConfigured: configured,
      };
    }

    const mapped = mapIntegrationDbStatus(undefined);
    return {
      provider: item.provider,
      title: item.title,
      description: item.description,
      category: item.category,
      capabilities: item.capabilities,
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
        customPublishing: null,
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
        customPublishing: null,
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

  const customPublishingConfig = await getCustomPublishingConfig(website.id);
  const githubPrConfig = await getGitHubPrConfig(website.id);
  const shopifyConfig = await getShopifyPublishingConfig(website.id);
  const webflowConfig = await getWebflowPublishingConfig(website.id);
  const customDisplay = buildCustomPublishingDisplayState({
    endpointConfigured: customPublishingConfig?.endpointConfigured,
    endpointHost: customPublishingConfig?.endpointHost,
    testedAt: customPublishingConfig?.testedAt,
    hasSharedSecret: customPublishingConfig?.hasSharedSecret,
  });

  const integrations = INTEGRATION_CATALOG.map((item) => {
    if (item.provider === "hermes_ai") {
      const configured = isHermesConfigured();
      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        category: item.category,
        capabilities: item.capabilities,
        connected: configured,
        status: configured ? "Configured" : "Not configured",
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt: null,
        lastSyncAt: null,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
        platformManaged: item.platformManaged ?? true,
        hermesConfigured: configured,
      };
    }

    const record = item.dbProvider
      ? dbByProvider.get(item.dbProvider)
      : undefined;
    const mapped = mapIntegrationDbStatus(record?.status);

    if (item.provider === "custom_webhook") {
      const connected = Boolean(
        customPublishingConfig?.endpointConfigured &&
          customPublishingConfig.testedAt
      );

      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        category: item.category,
        capabilities: item.capabilities,
        connected,
        status: connected ? "Connected" : mapped.status,
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt: connected
          ? (customPublishingConfig?.testedAt ?? null)
          : null,
        lastSyncAt: null,
        lastSuccessAt: connected
          ? (customPublishingConfig?.testedAt ?? null)
          : null,
        lastErrorAt: record?.lastErrorAt?.toISOString() ?? null,
        lastErrorMessage: record?.lastErrorMessage ?? null,
      };
    }

    if (item.provider === "github") {
      const connected = githubPrConfig?.connected === true;
      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        category: item.category,
        capabilities: item.capabilities,
        connected,
        status: connected ? "Connected" : mapped.status,
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt: connected ? githubPrConfig?.testedAt ?? null : null,
        lastSyncAt: null,
        lastSuccessAt: connected ? githubPrConfig?.testedAt ?? null : null,
        lastErrorAt: record?.lastErrorAt?.toISOString() ?? null,
        lastErrorMessage: record?.lastErrorMessage ?? null,
      };
    }

    if (item.provider === "webflow") {
      const connected = webflowConfig?.connected === true;
      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        category: item.category,
        capabilities: item.capabilities,
        connected,
        status: connected ? "Connected" : mapped.status,
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt: connected ? webflowConfig?.testedAt ?? null : null,
        lastSyncAt: null,
        lastSuccessAt: connected ? webflowConfig?.testedAt ?? null : null,
        lastErrorAt: record?.lastErrorAt?.toISOString() ?? null,
        lastErrorMessage: record?.lastErrorMessage ?? null,
      };
    }

    if (item.provider === "shopify") {
      const connected = shopifyConfig?.connected === true;
      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        category: item.category,
        capabilities: item.capabilities,
        connected,
        status: connected ? "Connected" : mapped.status,
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt: connected ? shopifyConfig?.testedAt ?? null : null,
        lastSyncAt: null,
        lastSuccessAt: connected ? shopifyConfig?.testedAt ?? null : null,
        lastErrorAt: record?.lastErrorAt?.toISOString() ?? null,
        lastErrorMessage: record?.lastErrorMessage ?? null,
      };
    }

    if (item.provider === "hosted_blog" || item.provider === "sitemap") {
      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        category: item.category,
        capabilities: item.capabilities,
        connected: true,
        status: "Configured",
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt: null,
        lastSyncAt: null,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
        platformManaged: true,
      };
    }

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
        category: item.category,
        capabilities: item.capabilities,
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

    if (item.provider === "google_search_console") {
      const selectedProperty = mapped.connected
        ? (record?.googleData?.searchConsoleSiteUrl ?? null)
        : null;
      const gscState = resolveGscConnectionState({
        integrationStatus: record?.status,
        selectedProperty,
        hasError: Boolean(record?.lastErrorMessage),
      });
      const awaitingProperty = gscState === "GOOGLE_CONNECTED_NO_PROPERTY";

      return {
        provider: item.provider,
        title: item.title,
        description: item.description,
        category: item.category,
        capabilities: item.capabilities,
        // Partial connection is not a "fully connected" integration.
        connected: gscState === "CONNECTED",
        status: awaitingProperty ? "NeedsProperty" : mapped.status,
        available: item.available,
        comingSoon: item.comingSoon,
        connectedAt:
          mapped.connected && record ? record.updatedAt.toISOString() : null,
        // Do not imply a property sync happened when none is selected.
        lastSyncAt: awaitingProperty
          ? null
          : (record?.lastSyncAt?.toISOString() ?? null),
        lastSuccessAt: record?.lastSuccessAt?.toISOString() ?? null,
        lastErrorAt: record?.lastErrorAt?.toISOString() ?? null,
        lastErrorMessage: record?.lastErrorMessage ?? null,
        gscState,
        googleConnected: mapped.connected,
        selectedProperty,
        metricsSummary: awaitingProperty
          ? null
          : mapped.connected
            ? extractGscMetricsSummary(record?.googleData?.metricsJson)
            : null,
        lastFetchedAt: awaitingProperty
          ? null
          : (record?.googleData?.lastFetchedAt?.toISOString() ?? null),
      };
    }

    return {
      provider: item.provider,
      title: item.title,
      description: item.description,
      category: item.category,
      capabilities: item.capabilities,
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
    };
  });

  return {
    data: {
      website: { id: website.id, url: website.url },
      integrations,
      customPublishing: customPublishingConfig
        ? {
            endpointConfigured: customPublishingConfig.endpointConfigured,
            endpointHost: customPublishingConfig.endpointHost,
            testedAt: customPublishingConfig.testedAt,
            hasSharedSecret: customPublishingConfig.hasSharedSecret,
            connectedBanner: customDisplay.connectedBanner,
          }
        : null,
    },
  };
}
