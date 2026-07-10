"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatCheckCategory,
  taskPriorityToCardPriority,
  taskStatusToCardStatus,
} from "@/lib/dashboard/display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { TaskListItem } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskDetailSheetProps = {
  task: TaskListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteUrl?: string;
  actionLoading?: boolean;
  actionError?: string | null;
  onMarkDone?: () => void;
  onMarkInProgress?: () => void;
  onSkip?: () => void;
};

const priorityStyles = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const;

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  websiteUrl,
  actionLoading = false,
  actionError,
  onMarkDone,
  onMarkInProgress,
  onSkip,
}: TaskDetailSheetProps) {
  const { dict, locale } = useSaasTranslations();
  const t = dict.tasksPage;

  if (!task) {
    return null;
  }

  const cardStatus = taskStatusToCardStatus(task.status);
  const cardPriority = taskPriorityToCardPriority(task.priority);
  const isActive = cardStatus === "open" || cardStatus === "in_progress";
  const description =
    task.description ??
    task.recommendedAction ??
    t.detailFallbackDescription;
  const whyItMatters = task.whyItMatters;
  const recommendedAction = task.recommendedAction;

  function sourceLabel(source: string): string {
    const key = source.toLowerCase() as keyof typeof t.sources;
    return t.sources[key] ?? source;
  }

  function statusLabel(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized === "in_progress") return t.statusLabels.inProgress;
    if (normalized === "completed") return t.statusLabels.completed;
    if (normalized === "dismissed") return t.statusLabels.dismissed;
    if (normalized === "waiting_review") return t.statusLabels.waitingReview;
    return t.statusLabels.open;
  }

  function priorityLabel(priority: string): string {
    const normalized = priority.toLowerCase();
    if (normalized === "critical") return t.priorityLabels.critical;
    if (normalized === "high") return t.priorityLabels.high;
    if (normalized === "medium") return t.priorityLabels.medium;
    return t.priorityLabels.low;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="max-h-[100dvh] w-full overflow-y-auto border-slate-200 bg-white text-slate-700 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-slate-200 pb-4">
          <SheetTitle className="text-left text-xl text-slate-900">
            {task.title}
          </SheetTitle>
          <SheetDescription className="text-left text-slate-600">
            {formatCheckCategory(task.category)}
            {websiteUrl ? ` · ${websiteUrl}` : ""}
          </SheetDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {statusLabel(task.status)}
            </span>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                priorityStyles[cardPriority]
              )}
            >
              {priorityLabel(task.priority)}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-4 py-2">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              {t.detailDescriptionLabel}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">{description}</p>
          </section>

          {whyItMatters ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {t.detailWhyItMattersLabel}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {whyItMatters}
              </p>
            </section>
          ) : null}

          {recommendedAction && recommendedAction !== task.description ? (
            <section className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {t.detailRecommendedActionLabel}
              </h3>
              <p className="text-sm leading-relaxed text-slate-700">
                {recommendedAction}
              </p>
            </section>
          ) : null}

          <section className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {t.sourceLabel}
              </p>
              <p className="mt-1 font-medium text-slate-700">
                {sourceLabel(task.source)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {t.createdLabel}
              </p>
              <p className="mt-1 font-medium text-slate-700">
                {formatDate(task.createdAt, locale)}
              </p>
            </div>
            {task.completedAt ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {t.completedLabel}
                </p>
                <p className="mt-1 font-medium text-slate-700">
                  {formatDate(task.completedAt, locale)}
                </p>
              </div>
            ) : null}
            {task.impactScore != null ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {t.impactLabel}
                </p>
                <p className="mt-1 font-medium text-slate-700">
                  {task.impactScore}
                </p>
              </div>
            ) : null}
          </section>

          {actionError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
        </div>

        {isActive ? (
          <SheetFooter className="border-t border-slate-200">
            <div className="flex w-full flex-col gap-2">
              <Button
                type="button"
                disabled={actionLoading}
                onClick={onMarkDone}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {t.markDone}
              </Button>
              {cardStatus === "open" && onMarkInProgress ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={onMarkInProgress}
                  className="w-full border-slate-200 bg-white text-slate-700"
                >
                  {t.markInProgress}
                </Button>
              ) : null}
              {onSkip ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={actionLoading}
                  onClick={onSkip}
                  className="w-full text-slate-500 hover:text-slate-700"
                >
                  {t.skipTask}
                </Button>
              ) : null}
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
