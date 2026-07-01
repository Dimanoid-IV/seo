import type { TimelineSummary } from "@/lib/timeline/types";
import { cn } from "@/lib/utils";

type TimelineSummaryCardProps = {
  summary: TimelineSummary;
  unreadCount: number;
  className?: string;
};

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "emerald" | "blue" | "amber" | "violet";
}) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "amber"
        ? "text-amber-300"
        : accent === "violet"
          ? "text-violet-300"
          : "text-blue-300";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", accentClass)}>{value}</p>
    </div>
  );
}

export function TimelineSummaryCard({
  summary,
  unreadCount,
  className,
}: TimelineSummaryCardProps) {
  const scoreLabel =
    summary.scoreDelta != null && summary.scoreDelta !== 0
      ? `${summary.scoreDelta > 0 ? "+" : ""}${summary.scoreDelta}`
      : "—";

  return (
    <section
      className={cn(
        "glass-card space-y-5 border border-white/10 p-5 sm:p-6",
        className
      )}
    >
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
          Пока вас не было
        </p>
        <h2 className="text-xl font-bold text-white sm:text-2xl">
          Growth Timeline
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          {summary.headline}
        </p>
        {unreadCount > 0 ? (
          <p className="text-xs text-blue-300">
            {unreadCount} unread {unreadCount === 1 ? "event" : "events"}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="New opportunities"
          value={summary.opportunitiesCount}
          accent="blue"
        />
        <StatTile
          label="New tasks"
          value={summary.newTasksCount}
          accent="violet"
        />
        <StatTile
          label="Completed tasks"
          value={summary.completedTasksCount}
          accent="emerald"
        />
        <StatTile
          label="Warnings"
          value={summary.warningsCount}
          accent="amber"
        />
        <StatTile label="Growth Score" value={scoreLabel} accent="emerald" />
      </div>
    </section>
  );
}
