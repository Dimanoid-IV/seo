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
  low: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  medium: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  high: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  critical: "text-red-300 bg-red-500/10 border-red-500/20",
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
  open: { icon: Clock, label: "Открыта", className: "text-slate-400" },
  in_progress: {
    icon: Loader2,
    label: "В работе",
    className: "text-blue-400",
  },
  waiting: {
    icon: AlertCircle,
    label: "На проверке",
    className: "text-amber-400",
  },
  completed: {
    icon: CheckCircle2,
    label: "Выполнена",
    className: "text-emerald-400",
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
        "glass-card group flex flex-col gap-3 p-4 transition-colors hover:border-white/15 sm:p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">
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
            Impact: <span className="font-semibold text-slate-300">{impactScore}</span>
          </span>
        ) : null}
      </div>

      <div>
        <h3 className="font-semibold text-white group-hover:text-blue-100">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">{description}</p>
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
        <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
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
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Скрыть
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
