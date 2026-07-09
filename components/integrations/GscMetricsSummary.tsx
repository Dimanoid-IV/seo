import type { GscMetricsSummary } from "@/lib/integrations/gsc-types";
import {
  formatGscCtr,
  formatGscPosition,
} from "@/lib/integrations/gsc-metrics";
import { cn } from "@/lib/utils";

type GscMetricsSummaryProps = {
  summary: GscMetricsSummary;
  className?: string;
  compact?: boolean;
};

export function GscMetricsSummaryDisplay({
  summary,
  className,
  compact = false,
}: GscMetricsSummaryProps) {
  const items = [
    { label: "Клики", value: summary.clicks.toLocaleString("ru-RU") },
    {
      label: "Показы",
      value: summary.impressions.toLocaleString("ru-RU"),
    },
    { label: "CTR", value: formatGscCtr(summary.ctr) },
    {
      label: "Средняя позиция",
      value: formatGscPosition(summary.position),
    },
  ];

  return (
    <dl
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
        >
          <dt className="text-[11px] uppercase tracking-wide text-slate-500">
            {item.label}
          </dt>
          <dd className="mt-1 text-lg font-semibold text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
