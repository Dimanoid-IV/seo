"use client";

import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatRelativeTime } from "@/lib/dashboard/display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { ReportsActivityEntry } from "@/lib/reports/types";
import { Activity } from "lucide-react";

type ReportActivityListProps = {
  activities: ReportsActivityEntry[];
};

function activityAccent(
  type: string,
  archived: boolean
): "blue" | "cyan" | "violet" | "emerald" | "amber" {
  if (archived) {
    return "amber";
  }
  if (type.includes("AUDIT")) {
    return "blue";
  }
  if (type.includes("GROWTH") || type.includes("SCORE")) {
    return "emerald";
  }
  if (type.includes("ARTICLE") || type.includes("CONTENT")) {
    return "cyan";
  }
  if (type.includes("TASK")) {
    return "violet";
  }
  return "amber";
}

export function ReportActivityList({ activities }: ReportActivityListProps) {
  const { dict } = useSaasTranslations();
  const r = dict.reports;

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title={r.activityEmptyTitle}
        description={r.activityEmptyDescription}
      />
    );
  }

  return (
    <div className="glass-card divide-y divide-white/5 px-4">
      {activities.map((activity) => {
        const archived = Boolean(activity.archived);
        const localizedTitle =
          r.activityTitles[activity.type] ?? activity.title;
        const title = archived
          ? `${localizedTitle} · ${r.activityArchivedBadge}`
          : localizedTitle;

        return (
          <ActivityItem
            key={activity.id}
            title={title}
            description={activity.description ?? undefined}
            timestamp={formatRelativeTime(activity.createdAt)}
            accent={activityAccent(activity.type, archived)}
            className={archived ? "opacity-60" : undefined}
          />
        );
      })}
    </div>
  );
}
