import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatRelativeTime } from "@/lib/dashboard/display";
import type { ReportsActivityEntry } from "@/lib/reports/types";
import { Activity } from "lucide-react";

type ReportActivityListProps = {
  activities: ReportsActivityEntry[];
};

function activityAccent(
  type: string
): "blue" | "cyan" | "violet" | "emerald" | "amber" {
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
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Пока нет событий"
        description="Активность появится после аудита, задач и проверок сайта."
      />
    );
  }

  return (
    <div className="glass-card divide-y divide-white/5 px-4">
      {activities.map((activity) => (
        <ActivityItem
          key={activity.id}
          title={activity.title}
          description={activity.description ?? undefined}
          timestamp={formatRelativeTime(activity.createdAt)}
          accent={activityAccent(activity.type)}
        />
      ))}
    </div>
  );
}
