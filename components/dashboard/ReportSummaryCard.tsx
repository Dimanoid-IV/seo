import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type ReportSummaryCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "blue" | "emerald" | "violet" | "amber";
  className?: string;
};

const accentStyles = {
  blue: "border-blue-500/20 bg-blue-500/5",
  emerald: "border-emerald-500/20 bg-emerald-500/5",
  violet: "border-violet-500/20 bg-violet-500/5",
  amber: "border-amber-500/20 bg-amber-500/5",
};

const iconStyles = {
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
};

export function ReportSummaryCard({
  title,
  value,
  subtitle,
  hint,
  icon: Icon,
  accent = "blue",
  className,
}: ReportSummaryCardProps) {
  return (
    <div
      className={cn(
        "glass-card flex flex-col gap-3 border p-5",
        accentStyles[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</p>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          ) : null}
          {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {Icon ? (
          <Icon className={cn("size-7 shrink-0 opacity-70", iconStyles[accent])} />
        ) : null}
      </div>
    </div>
  );
}
