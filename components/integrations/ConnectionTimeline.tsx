import { formatRelativeTime } from "@/lib/dashboard/display";
import type { IntegrationOverviewItem } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Link2, RefreshCw } from "lucide-react";

type ConnectionTimelineProps = {
  integration: IntegrationOverviewItem;
  className?: string;
};

type TimelineEvent = {
  label: string;
  at: string | null;
  tone: "neutral" | "success" | "error";
};

export function ConnectionTimeline({
  integration,
  className,
}: ConnectionTimelineProps) {
  const events: TimelineEvent[] = (
    [
      {
        label: "Подключено",
        at: integration.connectedAt,
        tone: "success" as const,
      },
      {
        label: "Последняя синхронизация",
        at: integration.lastSyncAt ?? integration.lastSuccessAt,
        tone: "neutral" as const,
      },
      {
        label: "Последняя ошибка",
        at: integration.lastErrorAt,
        tone: "error" as const,
      },
    ] satisfies TimelineEvent[]
  ).filter((event) => event.at != null);

  const hasProperty =
    integration.provider === "google_search_console" &&
    Boolean(integration.selectedProperty);

  if (events.length === 0 && !hasProperty) {
    return (
      <p className={cn("text-xs text-slate-500", className)}>
        {integration.comingSoon
          ? "Интеграция появится в следующих релизах"
          : "Синхронизаций пока не было"}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {hasProperty ? (
        <li className="flex items-start gap-2 text-xs">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-cyan-700" />
          <div className="min-w-0">
            <p className="text-slate-600">Search Console property</p>
            <p className="truncate text-slate-500">
              {integration.selectedProperty}
            </p>
          </div>
        </li>
      ) : null}
      {events.map((event) => (
        <li key={event.label} className="flex items-start gap-2 text-xs">
          {event.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
          ) : event.tone === "error" ? (
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-700" />
          ) : (
            <RefreshCw className="mt-0.5 size-3.5 shrink-0 text-slate-500" />
          )}
          <div className="min-w-0">
            <p className="text-slate-600">{event.label}</p>
            <p className="text-slate-500">{formatRelativeTime(event.at!)}</p>
          </div>
        </li>
      ))}
      {integration.lastErrorMessage ? (
        <li className="flex items-start gap-2 text-xs text-red-700">
          <Link2 className="mt-0.5 size-3.5 shrink-0" />
          <span className="line-clamp-2">{integration.lastErrorMessage}</span>
        </li>
      ) : null}
    </ul>
  );
}
