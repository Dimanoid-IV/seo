import type { GscMetricsJson, GscPerformanceRow } from "./gsc-types";
import { formatGscCtr, formatGscPosition } from "./gsc-metrics";

export type GscOpportunityKind =
  | "LOW_CTR_PAGE_QUERY"
  | "NEAR_PAGE_ONE_PAGE_QUERY"
  | "PAGE_TWO_PAGE_QUERY";

export type GscPageQueryOpportunity = {
  id: string;
  kind: GscOpportunityKind;
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  priority: "HIGH" | "MEDIUM";
  title: string;
  recommendation: string;
  measured: true;
  source: "GSC";
  period: GscMetricsJson["period"];
};

function stableId(kind: GscOpportunityKind, page: string, query: string): string {
  return `${kind}:${page}:${query}`.toLowerCase();
}

function validPageQuery(row: GscPerformanceRow): row is GscPerformanceRow & {
  page: string;
  query: string;
} {
  return Boolean(row.page?.trim() && row.query?.trim());
}

function titleFor(kind: GscOpportunityKind, query: string): string {
  if (kind === "LOW_CTR_PAGE_QUERY") {
    return `Улучшить title/meta для запроса «${query}»`;
  }
  if (kind === "NEAR_PAGE_ONE_PAGE_QUERY") {
    return `Дотянуть страницу до топ-3 по запросу «${query}»`;
  }
  return `Поднять страницу со второй страницы Google по запросу «${query}»`;
}

function recommendationFor(row: GscPerformanceRow & { page: string; query: string }): string {
  return [
    `Страница ${row.page} уже получает показы по запросу «${row.query}».`,
    `Метрики за период: ${row.impressions} показов, CTR ${formatGscCtr(row.ctr)}, средняя позиция ${formatGscPosition(row.position)}.`,
    "Подготовьте более убедительный SEO title и meta description под этот запрос, затем проверьте изменение после публикации.",
  ].join(" ");
}

export function findGscPageQueryOpportunities(
  metrics: Pick<GscMetricsJson, "period" | "pageQueries">,
  limit = 5
): GscPageQueryOpportunity[] {
  const opportunities: GscPageQueryOpportunity[] = [];
  const seen = new Set<string>();

  const rows = (metrics.pageQueries ?? [])
    .filter(validPageQuery)
    .filter((row) => row.impressions >= 30)
    .sort((a, b) => b.impressions - a.impressions);

  for (const row of rows) {
    let kind: GscOpportunityKind | null = null;
    let priority: "HIGH" | "MEDIUM" = "MEDIUM";

    if (row.impressions >= 100 && row.ctr < 0.015 && row.position <= 20) {
      kind = "LOW_CTR_PAGE_QUERY";
      priority = "HIGH";
    } else if (row.position >= 4 && row.position <= 10) {
      kind = "NEAR_PAGE_ONE_PAGE_QUERY";
    } else if (row.position > 10 && row.position <= 20) {
      kind = "PAGE_TWO_PAGE_QUERY";
    }

    if (!kind) continue;

    const id = stableId(kind, row.page, row.query);
    if (seen.has(id)) continue;
    seen.add(id);

    opportunities.push({
      id,
      kind,
      page: row.page,
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      priority,
      title: titleFor(kind, row.query),
      recommendation: recommendationFor(row),
      measured: true,
      source: "GSC",
      period: metrics.period,
    });

    if (opportunities.length >= limit) break;
  }

  return opportunities;
}
