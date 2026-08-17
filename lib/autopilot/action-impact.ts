export type MetricPoint = {
  date: Date;
  impressions: number;
  clicks: number;
  position: number | null;
};

export type MetricSummary = {
  days: number;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number | null;
};

export function summarizeMetricPoints(points: MetricPoint[]): MetricSummary {
  const days = new Set(points.map((point) => point.date.toISOString().slice(0, 10))).size;
  const impressions = points.reduce((sum, point) => sum + point.impressions, 0);
  const clicks = points.reduce((sum, point) => sum + point.clicks, 0);
  const ranked = points.filter((point) => point.position !== null && point.impressions > 0);
  const positionWeight = ranked.reduce((sum, point) => sum + point.impressions, 0);
  return {
    days,
    impressions,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: positionWeight > 0
      ? ranked.reduce((sum, point) => sum + (point.position ?? 0) * point.impressions, 0) / positionWeight
      : null,
  };
}

export function relativeChange(before: number, after: number): number | null {
  return before === 0 ? null : (after - before) / Math.abs(before);
}

export function impactConfidence(beforeDays: number, afterDays: number): number {
  return Math.round(Math.min(beforeDays / 14, afterDays / 14, 1) * 80) / 100;
}
