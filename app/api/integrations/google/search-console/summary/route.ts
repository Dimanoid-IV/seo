import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getPrisma } from "@/lib/db";
import {
  extractGscMetricsSummary,
  getGscPerformanceDateRange,
  parseGscMetricsJson,
} from "@/lib/integrations/gsc-metrics";
import { resolveConnectedGscContext } from "@/lib/integrations/gsc-context";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const context = await resolveConnectedGscContext(currentUser);
    const prisma = getPrisma();

    const googleData = await prisma.googleIntegrationData.findUnique({
      where: { integrationId: context.integration.id },
      select: {
        metricsJson: true,
        lastFetchedAt: true,
        searchConsoleSiteUrl: true,
      },
    });

    const parsed = parseGscMetricsJson(googleData?.metricsJson);
    const defaultPeriod = getGscPerformanceDateRange(28);

    return authJsonResponse({
      data: {
        connected: true,
        selectedSiteUrl:
          googleData?.searchConsoleSiteUrl ?? context.selectedSiteUrl,
        period: parsed?.period ?? defaultPeriod,
        summary:
          parsed?.summary ??
          extractGscMetricsSummary(googleData?.metricsJson) ??
          null,
        syncedAt: parsed?.syncedAt ?? null,
        lastFetchedAt: googleData?.lastFetchedAt?.toISOString() ?? null,
        empty:
          !parsed?.summary ||
          (parsed.summary.clicks === 0 && parsed.summary.impressions === 0),
        note:
          "Read-only cached summary from the last sync. Search Console data may be delayed by 1–3 days.",
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
