import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Share2,
  Target,
  TrendingUp,
} from "lucide-react";

import type { MonthlyAutopilotMetrics } from "@/lib/autopilot/types";

type AutopilotMetricsGridProps = {
  metrics: MonthlyAutopilotMetrics;
};

const METRICS = [
  {
    key: "growthScore" as const,
    label: "Growth Score",
    icon: TrendingUp,
    format: (m: MonthlyAutopilotMetrics) =>
      m.growthScore != null ? String(m.growthScore) : "—",
  },
  {
    key: "growthScoreDelta" as const,
    label: "Score delta",
    icon: Target,
    format: (m: MonthlyAutopilotMetrics) => {
      if (m.growthScoreDelta == null) return "—";
      const sign = m.growthScoreDelta > 0 ? "+" : "";
      return `${sign}${m.growthScoreDelta}`;
    },
  },
  {
    key: "openTasksCount" as const,
    label: "Open tasks",
    icon: AlertTriangle,
    format: (m: MonthlyAutopilotMetrics) => String(m.openTasksCount),
  },
  {
    key: "completedTasksCount" as const,
    label: "Completed",
    icon: CheckCircle2,
    format: (m: MonthlyAutopilotMetrics) => String(m.completedTasksCount),
  },
  {
    key: "opportunitiesCount" as const,
    label: "Opportunities",
    icon: Target,
    format: (m: MonthlyAutopilotMetrics) => String(m.opportunitiesCount),
  },
  {
    key: "warningsCount" as const,
    label: "Warnings",
    icon: AlertTriangle,
    format: (m: MonthlyAutopilotMetrics) => String(m.warningsCount),
  },
  {
    key: "draftArticlesCount" as const,
    label: "Draft articles",
    icon: FileText,
    format: (m: MonthlyAutopilotMetrics) => String(m.draftArticlesCount),
  },
  {
    key: "readySocialPostsCount" as const,
    label: "Ready social posts",
    icon: Share2,
    format: (m: MonthlyAutopilotMetrics) => String(m.readySocialPostsCount),
  },
];

export function AutopilotMetricsGrid({ metrics }: AutopilotMetricsGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {METRICS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <Icon className="size-4" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {item.format(metrics)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
