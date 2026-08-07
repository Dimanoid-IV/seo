import type {
  GscMetricsJson,
  GscMetricsSummary,
  GscPerformanceRow,
} from "@/lib/integrations/gsc-types";

const EMPTY_SUMMARY: GscMetricsSummary = {
  clicks: 0,
  impressions: 0,
  ctr: 0,
  position: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function toStringValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

function parsePerformanceRows(value: unknown): GscPerformanceRow[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const rows: GscPerformanceRow[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const clicks = toNumber(item.clicks);
    const impressions = toNumber(item.impressions);
    const ctr = toNumber(item.ctr);
    const position = toNumber(item.position);
    if (
      clicks === null ||
      impressions === null ||
      ctr === null ||
      position === null
    ) {
      continue;
    }
    rows.push({
      keys: Array.isArray(item.keys)
        ? item.keys.filter((key): key is string => typeof key === "string")
        : [],
      page: toStringValue(item.page) ?? undefined,
      query: toStringValue(item.query) ?? undefined,
      clicks,
      impressions,
      ctr,
      position,
    });
  }

  return rows.length > 0 ? rows : undefined;
}

/**
 * Parses stored GoogleIntegrationData.metricsJson into a typed structure.
 */
export function parseGscMetricsJson(
  metricsJson: unknown
): GscMetricsJson | null {
  if (!isRecord(metricsJson)) {
    return null;
  }

  const period = isRecord(metricsJson.period) ? metricsJson.period : null;
  const summary = isRecord(metricsJson.summary) ? metricsJson.summary : null;
  const syncedAt = toStringValue(metricsJson.syncedAt);
  const startDate = period ? toStringValue(period.startDate) : null;
  const endDate = period ? toStringValue(period.endDate) : null;

  if (!summary || !syncedAt || !startDate || !endDate) {
    return null;
  }

  const clicks = toNumber(summary.clicks);
  const impressions = toNumber(summary.impressions);
  const ctr = toNumber(summary.ctr);
  const position = toNumber(summary.position);

  if (
    clicks === null ||
    impressions === null ||
    ctr === null ||
    position === null
  ) {
    return null;
  }

  return {
    period: { startDate, endDate },
    summary: { clicks, impressions, ctr, position },
    pages: parsePerformanceRows(metricsJson.pages),
    queries: parsePerformanceRows(metricsJson.queries),
    pageQueries: parsePerformanceRows(metricsJson.pageQueries),
    syncedAt,
    ...(typeof metricsJson.tasksCreatedLastSync === "number"
      ? { tasksCreatedLastSync: metricsJson.tasksCreatedLastSync }
      : {}),
  };
}

export function extractGscTasksCreatedLastSync(metricsJson: unknown): number | null {
  if (!isRecord(metricsJson)) {
    return null;
  }
  const value = metricsJson.tasksCreatedLastSync;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function extractGscMetricsSummary(
  metricsJson: unknown
): GscMetricsSummary | null {
  return parseGscMetricsJson(metricsJson)?.summary ?? null;
}

/**
 * Returns a 28-day date range ending yesterday (UTC) for GSC queries.
 */
export function getGscPerformanceDateRange(days = 28): {
  startDate: string;
  endDate: string;
} {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function formatGscCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(2)}%`;
}

export function formatGscPosition(position: number): string {
  return position.toFixed(1);
}

export { EMPTY_SUMMARY };
