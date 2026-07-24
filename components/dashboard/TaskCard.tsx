import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "open" | "in_progress" | "waiting" | "completed" | "dismissed";

type TaskCardProps = {
  title: string;
  description?: string;
  category: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  impactScore?: number;
  className?: string;
  showActions?: boolean;
  actionLoading?: boolean;
  footerAction?: ReactNode;
  onComplete?: () => void;
  onDismiss?: () => void;
};

const priorityStyles: Record<TaskPriority, string> = {
  low: "text-slate-700 bg-slate-50 border-slate-200",
  medium: "text-blue-800 bg-blue-50 border-blue-200",
  high: "text-amber-800 bg-amber-50 border-amber-200",
  critical: "text-red-700 bg-red-50 border-red-200",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критичный",
};

const statusConfig: Record<
  TaskStatus,
  { icon: typeof Clock; label: string; className: string }
> = {
  open: { icon: Clock, label: "Открыта", className: "text-slate-600" },
  in_progress: {
    icon: Loader2,
    label: "В работе",
    className: "text-blue-700",
  },
  waiting: {
    icon: AlertCircle,
    label: "На проверке",
    className: "text-amber-700",
  },
  completed: {
    icon: CheckCircle2,
    label: "Выполнена",
    className: "text-emerald-700",
  },
  dismissed: {
    icon: ArrowUpRight,
    label: "Отклонена",
    className: "text-slate-500",
  },
};

export function TaskCard({
  title,
  description,
  category,
  priority = "medium",
  status = "open",
  impactScore,
  className,
  showActions = false,
  actionLoading = false,
  footerAction,
  onComplete,
  onDismiss,
}: TaskCardProps) {
  const StatusIcon = statusConfig[status].icon;
  const canShowActions =
    showActions &&
    (status === "open" || status === "in_progress") &&
    (onComplete != null || onDismiss != null);

  return (
    <article
      className={cn(
        "glass-card group flex flex-col gap-3 p-4 transition-colors hover:border-slate-300 sm:p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
          {category}
        </span>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium",
            priorityStyles[priority]
          )}
        >
          {priorityLabels[priority]}
        </span>
        {impactScore != null ? (
          <span className="ml-auto text-xs text-slate-500">
            Impact: <span className="font-semibold text-slate-600">{impactScore}</span>
          </span>
        ) : null}
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>

      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          statusConfig[status].className
        )}
      >
        <StatusIcon
          className={cn("size-3.5", status === "in_progress" && "animate-spin")}
        />
        {statusConfig[status].label}
      </div>

      {footerAction ? <div className="pt-1">{footerAction}</div> : null}

      {canShowActions ? (
        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
          {onComplete ? (
            <button
              type="button"
              onClick={onComplete}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3" />
              )}
              Готово
            </button>
          ) : null}
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Скрыть
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
