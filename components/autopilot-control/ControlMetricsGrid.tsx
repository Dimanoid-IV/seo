"use client";

import {
  AlertTriangle,
  FileText,
  Mail,
  Share2,
  Target,
  TrendingUp,
} from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { ControlCenterMetrics } from "@/lib/autopilot-control/types";

type ControlMetricsGridProps = {
  metrics: ControlCenterMetrics;
};

const ITEMS = [
  { key: "growthScore" as const, labelKey: "growthScore" as const, icon: TrendingUp },
  { key: "openTasksCount" as const, labelKey: "openTasks" as const, icon: Target },
  {
    key: "highPriorityTasksCount" as const,
    labelKey: "highPriority" as const,
    icon: AlertTriangle,
  },
  { key: "pendingEmailsCount" as const, labelKey: "pendingEmails" as const, icon: Mail },
  { key: "draftArticlesCount" as const, labelKey: "draftArticles" as const, icon: FileText },
  {
    key: "readySocialPostsCount" as const,
    labelKey: "readySocialPosts" as const,
    icon: Share2,
  },
  {
    key: "integrationIssuesCount" as const,
    labelKey: "integrationIssues" as const,
    icon: AlertTriangle,
  },
  {
    key: "unreadTimelineEventsCount" as const,
    labelKey: "unreadActivity" as const,
    icon: Target,
  },
];

export function ControlMetricsGrid({ metrics }: ControlMetricsGridProps) {
  const { dict } = useSaasTranslations();
  const m = dict.controlCenter.metrics;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div key={item.key} className="saas-card-metric !p-5">
            <div className="flex items-center gap-2.5 text-slate-400">
              <Icon className="size-4 shrink-0" />
              <span className="text-xs font-medium">{m[item.labelKey]}</span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
