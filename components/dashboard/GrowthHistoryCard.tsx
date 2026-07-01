import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatRelativeTime } from "@/lib/dashboard/display";
import type { DashboardOverviewGrowthHistoryEntry } from "@/lib/dashboard/overview";
import { cn } from "@/lib/utils";
import { LineChart, TrendingDown, TrendingUp } from "lucide-react";

type GrowthHistoryCardProps = {
  history: DashboardOverviewGrowthHistoryEntry[];
  className?: string;
};

const CHART_WIDTH = 320;
const CHART_HEIGHT = 88;
const CHART_PADDING = 8;

function buildChartPoints(scores: number[]): string {
  if (scores.length === 0) {
    return "";
  }

  const minScore = Math.min(...scores, 0);
  const maxScore = Math.max(...scores, 100);
  const range = Math.max(maxScore - minScore, 1);
  const stepX =
    scores.length === 1
      ? 0
      : (CHART_WIDTH - CHART_PADDING * 2) / (scores.length - 1);

  return scores
    .map((score, index) => {
      const x = CHART_PADDING + index * stepX;
      const normalized = (score - minScore) / range;
      const y =
        CHART_HEIGHT - CHART_PADDING - normalized * (CHART_HEIGHT - CHART_PADDING * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function formatDelta(delta: number): string {
  return `${delta > 0 ? "+" : ""}${delta}`;
}

export function GrowthHistoryCard({ history, className }: GrowthHistoryCardProps) {
  if (history.length === 0) {
    return (
      <EmptyState
        icon={LineChart}
        title="История прогресса пока пуста"
        description="Запустите первую проверку — Growth Score сохранится здесь. Каждая новая проверка добавляется в историю."
        className={className}
      />
    );
  }

  const first = history[0]!;
  const last = history[history.length - 1]!;
  const totalChange = last.score - first.score;
  const scores = history.map((entry) => entry.score);
  const chartPoints = buildChartPoints(scores);

  return (
    <div className={cn("glass-card flex flex-col gap-4 p-5", className)}>
      <div>
        <h3 className="text-lg font-semibold text-white">История прогресса</h3>
        <p className="mt-1 text-sm text-slate-400">
          SEO не растёт мгновенно — но сайт должен становиться лучше каждый месяц.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Каждая новая проверка сохраняется в истории.
        </p>
      </div>

      {history.length === 1 ? (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-5 text-sm text-slate-300">
          Первый замер сохранён ({last.score} баллов). История появится после
          следующей проверки.
        </div>
      ) : (
        <>
          <div className="relative w-full overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] px-2 py-3">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="h-24 w-full"
              preserveAspectRatio="none"
              role="img"
              aria-label="График изменения Growth Score"
            >
              <defs>
                <linearGradient id="growthHistoryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {chartPoints ? (
                <>
                  <polygon
                    points={`${chartPoints} ${CHART_WIDTH - CHART_PADDING},${CHART_HEIGHT - CHART_PADDING} ${CHART_PADDING},${CHART_HEIGHT - CHART_PADDING}`}
                    fill="url(#growthHistoryFill)"
                  />
                  <polyline
                    points={chartPoints}
                    fill="none"
                    stroke="rgb(52, 211, 153)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {scores.map((score, index) => {
                    const points = chartPoints.split(" ");
                    const [x, y] = points[index]?.split(",").map(Number) ?? [0, 0];
                    return (
                      <circle
                        key={history[index]?.id ?? index}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="rgb(16, 185, 129)"
                        stroke="rgb(5, 8, 22)"
                        strokeWidth="1.5"
                      >
                        <title>{`${score} · ${formatRelativeTime(history[index]!.createdAt)}`}</title>
                      </circle>
                    );
                  })}
                </>
              ) : null}
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center sm:gap-4">
            <StatBlock label="Первый замер" value={String(first.score)} />
            <StatBlock label="Текущий" value={String(last.score)} />
            <StatBlock
              label="Изменение"
              value={formatDelta(totalChange)}
              accent={
                totalChange > 0
                  ? "positive"
                  : totalChange < 0
                    ? "negative"
                    : "neutral"
              }
              icon={
                totalChange > 0 ? (
                  <TrendingUp className="size-3.5" aria-hidden />
                ) : totalChange < 0 ? (
                  <TrendingDown className="size-3.5" aria-hidden />
                ) : null
              }
            />
          </div>

          <ul className="max-h-36 space-y-2 overflow-y-auto border-t border-white/5 pt-3">
            {[...history].reverse().slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="text-slate-500">
                  {formatRelativeTime(entry.createdAt)}
                </span>
                <span className="font-medium tabular-nums text-white">{entry.score}</span>
                {entry.delta != null && entry.delta !== 0 ? (
                  <span
                    className={cn(
                      "tabular-nums",
                      entry.delta > 0 ? "text-emerald-400" : "text-amber-400"
                    )}
                  >
                    {formatDelta(entry.delta)}
                  </span>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function StatBlock({
  label,
  value,
  accent = "neutral",
  icon,
}: {
  label: string;
  value: string;
  accent?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-3 sm:px-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 flex items-center justify-center gap-1 text-lg font-bold tabular-nums sm:text-xl",
          accent === "positive" && "text-emerald-400",
          accent === "negative" && "text-amber-400",
          accent === "neutral" && "text-white"
        )}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}
