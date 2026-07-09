import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type ActivityItemProps = {
  title: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
  accent?: "blue" | "cyan" | "violet" | "emerald" | "amber";
  className?: string;
};

const accentDot: Record<NonNullable<ActivityItemProps["accent"]>, string> = {
  blue: "bg-blue-400",
  cyan: "bg-cyan-400",
  violet: "bg-violet-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
};

export function ActivityItem({
  title,
  description,
  timestamp,
  icon: Icon,
  accent = "blue",
  className,
}: ActivityItemProps) {
  return (
    <div className={cn("flex gap-3 py-3", className)}>
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5",
            Icon ? "" : "mt-0.5"
          )}
        >
          {Icon ? (
            <Icon className="size-4 text-slate-400" />
          ) : (
            <span className={cn("size-2 rounded-full", accentDot[accent])} />
          )}
        </div>
        <div className="mt-1 w-px flex-1 bg-white/5" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className="text-sm font-medium text-slate-700">{title}</p>
          <time className="shrink-0 text-xs text-slate-500">{timestamp}</time>
        </div>
        {description ? (
          <p className="mt-0.5 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
