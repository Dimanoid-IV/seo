"use client";

import { cn } from "@/lib/utils";

type DashboardMetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  accent?: "emerald" | "cyan" | "amber";
};

const ACCENT: Record<NonNullable<DashboardMetricCardProps["accent"]>, string> = {
  emerald: "text-emerald-300",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
};

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  accent = "emerald",
}: DashboardMetricCardProps) {
  return (
    <div className="glass-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", ACCENT[accent])}>
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
