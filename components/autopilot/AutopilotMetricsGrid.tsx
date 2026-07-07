import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Share2,
  Target,
  TrendingUp,
} from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { MonthlyAutopilotMetrics } from "@/lib/autopilot/types";

type AutopilotMetricsGridProps = {
  metrics: MonthlyAutopilotMetrics;
};

const METRIC_KEYS = [
  "growthScore",
  "scoreDelta",
  "openTasks",
  "completed",
  "opportunities",
  "warnings",
  "draftArticles",
  "readySocialPosts",
] as const;

const METRIC_ICONS = {
  growthScore: TrendingUp,
  scoreDelta: Target,
  openTasks: AlertTriangle,
  completed: CheckCircle2,
  opportunities: Target,
  warnings: AlertTriangle,
  draftArticles: FileText,
  readySocialPosts: Share2,
} as const;

function formatMetricValue(
  key: (typeof METRIC_KEYS)[number],
  metrics: MonthlyAutopilotMetrics
): string {
  switch (key) {
    case "growthScore":
      return metrics.growthScore != null ? String(metrics.growthScore) : "—";
    case "scoreDelta": {
      if (metrics.growthScoreDelta == null) return "—";
      const sign = metrics.growthScoreDelta > 0 ? "+" : "";
      return `${sign}${metrics.growthScoreDelta}`;
    }
    case "openTasks":
      return String(metrics.openTasksCount);
    case "completed":
      return String(metrics.completedTasksCount);
    case "opportunities":
      return String(metrics.opportunitiesCount);
    case "warnings":
      return String(metrics.warningsCount);
    case "draftArticles":
      return String(metrics.draftArticlesCount);
    case "readySocialPosts":
      return String(metrics.readySocialPostsCount);
    default:
      return "—";
  }
}

export function AutopilotMetricsGrid({ metrics }: AutopilotMetricsGridProps) {
  const { dict } = useSaasTranslations();
  const labels = dict.dashboard.metrics;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {METRIC_KEYS.map((key) => {
        const Icon = METRIC_ICONS[key];
        return (
          <div
            key={key}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <Icon className="size-4" />
              <span className="text-xs font-medium">{labels[key]}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatMetricValue(key, metrics)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
