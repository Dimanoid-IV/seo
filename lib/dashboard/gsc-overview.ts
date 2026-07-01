import {
  IntegrationProvider,
  IntegrationStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import {
  extractGscMetricsSummary,
  extractGscTasksCreatedLastSync,
} from "@/lib/integrations/gsc-metrics";
import { generateGscInsights } from "@/lib/integrations/gsc-insights";

import {
  EMPTY_DASHBOARD_GSC,
  type DashboardGoogleSearchConsole,
} from "./types";

/**
 * Loads Google Search Console connection state and cached metrics for dashboard.
 */
export async function loadDashboardGoogleSearchConsole(
  websiteId: string
): Promise<DashboardGoogleSearchConsole> {
  const prisma = getPrisma();

  const integration = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      status: IntegrationStatus.CONNECTED,
    },
    select: {
      googleData: {
        select: {
          searchConsoleSiteUrl: true,
          metricsJson: true,
          lastFetchedAt: true,
        },
      },
    },
  });

  if (!integration) {
    return EMPTY_DASHBOARD_GSC;
  }

  const metricsSummary = extractGscMetricsSummary(
    integration.googleData?.metricsJson
  );

  return {
    connected: true,
    selectedProperty: integration.googleData?.searchConsoleSiteUrl ?? null,
    metricsSummary,
    lastFetchedAt:
      integration.googleData?.lastFetchedAt?.toISOString() ?? null,
    insights: metricsSummary ? generateGscInsights(metricsSummary) : [],
    tasksCreatedLastSync: extractGscTasksCreatedLastSync(
      integration.googleData?.metricsJson
    ),
  };
}
