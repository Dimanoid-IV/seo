import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type ScoreCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  icon?: LucideIcon;
  accent?: "blue" | "cyan" | "violet" | "emerald" | "amber";
  className?: string;
  children?: React.ReactNode;
};

const accentStyles = {
  blue: "border-blue-500/20 bg-blue-500/5",
  cyan: "border-cyan-500/20 bg-cyan-500/5",
  violet: "border-violet-500/20 bg-violet-500/5",
  emerald: "border-emerald-500/20 bg-emerald-500/5",
  amber: "border-amber-500/20 bg-amber-500/5",
};

const iconStyles = {
  blue: "text-blue-400",
  cyan: "text-cyan-400",
  violet: "text-violet-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
};

export function ScoreCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  accent = "blue",
  className,
  children,
}: ScoreCardProps) {
  return (
    <div
      className={cn(
        "glass-card flex flex-col gap-3 p-5",
        accentStyles[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="mt-1 text-3xl font-bold text-white tabular-nums">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {Icon ? (
          <Icon className={cn("size-8 shrink-0 opacity-60", iconStyles[accent])} />
        ) : null}
      </div>

      {trend ? (
        <p
          className={cn(
            "text-xs font-medium",
            trend.positive ? "text-emerald-400" : "text-slate-400"
          )}
        >
          {trend.value}
        </p>
      ) : null}

      {children}
    </div>
  );
}
