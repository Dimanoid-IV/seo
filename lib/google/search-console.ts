import { AppError, ErrorCode } from "@/lib/errors";
import { assertServerOnly } from "@/lib/security";

const SEARCH_CONSOLE_SITES_URL =
  "https://www.googleapis.com/webmasters/v3/sites";

export type SearchConsoleSite = {
  siteUrl: string;
  permissionLevel: string;
};

export type SearchConsolePerformanceSummary = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchConsolePerformanceInput = {
  accessToken: string;
  siteUrl: string;
  startDate: string;
  endDate: string;
};

type GoogleSitesApiResponse = {
  siteEntry?: Array<{
    siteUrl?: string;
    permissionLevel?: string;
  }>;
};

type GoogleSearchAnalyticsResponse = {
  rows?: Array<{
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
};

const EMPTY_PERFORMANCE: SearchConsolePerformanceSummary = {
  clicks: 0,
  impressions: 0,
  ctr: 0,
  position: 0,
};

function throwTokenExpired(): never {
  // TODO: refresh access token via refreshTokenEncrypted before retrying.
  throw new AppError(
    ErrorCode.INTEGRATION_ERROR,
    "Токен Google Search Console истёк. Переподключите интеграцию.",
    { details: { reason: "token_expired" } }
  );
}

function throwInsufficientPermission(): never {
  throw new AppError(
    ErrorCode.INTEGRATION_ERROR,
    "Недостаточно прав для доступа к данным Search Console",
    { details: { reason: "insufficient_permission" } }
  );
}

async function assertGscApiOk(
  response: Response,
  defaultMessage: string
): Promise<void> {
  if (response.status === 401) {
    throwTokenExpired();
  }

  if (response.status === 403) {
    throwInsufficientPermission();
  }

  if (!response.ok) {
    throw new AppError(ErrorCode.INTEGRATION_ERROR, defaultMessage, {
      details: { status: response.status },
    });
  }
}

/**
 * Lists Search Console properties available to the authenticated Google account.
 */
export async function getSearchConsoleSites(
  accessToken: string
): Promise<SearchConsoleSite[]> {
  assertServerOnly();

  const response = await fetch(SEARCH_CONSOLE_SITES_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  await assertGscApiOk(
    response,
    "Не удалось загрузить сайты из Google Search Console"
  );

  const body = (await response.json()) as GoogleSitesApiResponse;
  const entries = body.siteEntry ?? [];

  return entries
    .filter((entry): entry is { siteUrl: string; permissionLevel: string } =>
      Boolean(entry.siteUrl?.trim())
    )
    .map((entry) => ({
      siteUrl: entry.siteUrl.trim(),
      permissionLevel: entry.permissionLevel?.trim() || "unknown",
    }));
}

/**
 * Fetches aggregated Search Console performance for a date range (no dimensions).
 */
export async function getSearchConsolePerformance({
  accessToken,
  siteUrl,
  startDate,
  endDate,
}: SearchConsolePerformanceInput): Promise<SearchConsolePerformanceSummary> {
  assertServerOnly();

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: [],
    }),
    cache: "no-store",
  });

  await assertGscApiOk(
    response,
    "Не удалось загрузить метрики Google Search Console"
  );

  const body = (await response.json()) as GoogleSearchAnalyticsResponse;
  const row = body.rows?.[0];

  if (!row) {
    return EMPTY_PERFORMANCE;
  }

  return {
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  };
}
