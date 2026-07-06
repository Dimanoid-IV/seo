"use client";

import type { LucideIcon } from "lucide-react";
import { BarChart3, ClipboardCheck, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardMetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  accent?: "emerald" | "cyan" | "amber";
};

const ACCENT: Record<
  NonNullable<DashboardMetricCardProps["accent"]>,
  { value: string; icon: string; Icon: LucideIcon }
> = {
  emerald: { value: "text-emerald-300", icon: "text-emerald-400/80", Icon: TrendingUp },
  cyan: { value: "text-cyan-300", icon: "text-cyan-400/80", Icon: BarChart3 },
  amber: { value: "text-amber-300", icon: "text-amber-400/80", Icon: ClipboardCheck },
};

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  accent = "emerald",
}: DashboardMetricCardProps) {
  const styles = ACCENT[accent];
  const Icon = styles.Icon;

  return (
    <div className="saas-card-metric">
      <div className="flex items-center justify-between gap-3">
        <p className="saas-eyebrow">{title}</p>
        <Icon className={cn("size-4 shrink-0", styles.icon)} aria-hidden />
      </div>
      <p
        className={cn(
          "mt-4 text-3xl font-bold tracking-tight tabular-nums sm:text-[2rem]",
          styles.value
        )}
      >
        {value}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{subtitle}</p>
    </div>
  );
}
