import "server-only";

import { AppError, ErrorCode } from "@/lib/errors";

const GA4_DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const TIMEOUT_MS = 15_000;

export type Ga4DateRange = {
  startDate: string;
  endDate: string;
};

export type Ga4Summary = {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
  conversions: number;
  engagementRate: number;
};

export type Ga4PageRow = {
  pagePath: string;
  pageTitle: string;
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
  conversions: number;
  engagementRate: number;
};

type RunReportResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  totals?: Array<{ metricValues?: Array<{ value?: string }> }>;
};

function toNumber(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function propertyPath(propertyId: string): string {
  const id = propertyId.trim().replace(/^properties\//, "");
  return `properties/${id}`;
}

async function runReport<T>(
  input: {
    accessToken: string;
    propertyId: string;
    body: Record<string, unknown>;
  },
  parser: (response: RunReportResponse) => T
): Promise<T> {
  const response = await fetch(
    `${GA4_DATA_API}/${propertyPath(input.propertyId)}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "RankBoost-GA4/1.0",
      },
      body: JSON.stringify(input.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
    }
  );

  if (response.status === 401 || response.status === 403) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      "Google Analytics token expired or does not have access.",
      { details: { reason: "token_expired" } }
    );
  }

  if (!response.ok) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      `Не удалось загрузить Google Analytics данные (HTTP ${response.status}).`
    );
  }

  const body = (await response.json()) as RunReportResponse;
  return parser(body);
}

export async function getGa4Summary(input: {
  accessToken: string;
  propertyId: string;
  period: Ga4DateRange;
}): Promise<Ga4Summary> {
  return runReport(
    {
      accessToken: input.accessToken,
      propertyId: input.propertyId,
      body: {
        dateRanges: [input.period],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "conversions" },
          { name: "engagementRate" },
        ],
      },
    },
    (body) => {
      const values = body.totals?.[0]?.metricValues ?? body.rows?.[0]?.metricValues ?? [];
      return {
        activeUsers: toNumber(values[0]?.value),
        sessions: toNumber(values[1]?.value),
        screenPageViews: toNumber(values[2]?.value),
        conversions: toNumber(values[3]?.value),
        engagementRate: toNumber(values[4]?.value),
      };
    }
  );
}

export async function getGa4TopPages(input: {
  accessToken: string;
  propertyId: string;
  period: Ga4DateRange;
  rowLimit?: number;
}): Promise<Ga4PageRow[]> {
  return runReport(
    {
      accessToken: input.accessToken,
      propertyId: input.propertyId,
      body: {
        dateRanges: [input.period],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "conversions" },
          { name: "engagementRate" },
        ],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: String(input.rowLimit ?? 25),
      },
    },
    (body) =>
      (body.rows ?? []).map((row) => ({
        pagePath: row.dimensionValues?.[0]?.value ?? "",
        pageTitle: row.dimensionValues?.[1]?.value ?? "",
        activeUsers: toNumber(row.metricValues?.[0]?.value),
        sessions: toNumber(row.metricValues?.[1]?.value),
        screenPageViews: toNumber(row.metricValues?.[2]?.value),
        conversions: toNumber(row.metricValues?.[3]?.value),
        engagementRate: toNumber(row.metricValues?.[4]?.value),
      }))
  );
}
