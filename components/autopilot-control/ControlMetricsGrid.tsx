import {
  AlertTriangle,
  FileText,
  Mail,
  Share2,
  Target,
  TrendingUp,
} from "lucide-react";

import type { ControlCenterMetrics } from "@/lib/autopilot-control/types";

type ControlMetricsGridProps = {
  metrics: ControlCenterMetrics;
};

const ITEMS = [
  { key: "growthScore" as const, label: "Growth Score", icon: TrendingUp },
  { key: "openTasksCount" as const, label: "Open tasks", icon: Target },
  {
    key: "highPriorityTasksCount" as const,
    label: "High priority",
    icon: AlertTriangle,
  },
  { key: "pendingEmailsCount" as const, label: "Pending emails", icon: Mail },
  { key: "draftArticlesCount" as const, label: "Draft articles", icon: FileText },
  {
    key: "readySocialPostsCount" as const,
    label: "Ready social posts",
    icon: Share2,
  },
  {
    key: "integrationIssuesCount" as const,
    label: "Integration issues",
    icon: AlertTriangle,
  },
  {
    key: "unreadTimelineEventsCount" as const,
    label: "Unread activity",
    icon: Target,
  },
];

export function ControlMetricsGrid({ metrics }: ControlMetricsGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        let value: string;
        if (item.key === "growthScore") {
          const delta =
            metrics.growthScoreDelta != null
              ? ` (${metrics.growthScoreDelta > 0 ? "+" : ""}${metrics.growthScoreDelta})`
              : "";
          value =
            metrics.growthScore != null
              ? `${metrics.growthScore}${delta}`
              : "—";
        } else {
          value = String(metrics[item.key]);
        }

        return (
          <div
            key={item.key}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <Icon className="size-4" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </div>
        );
      })}
    </div>
  );
}
