"use client";

import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { GenerateArticleForm } from "@/components/content-plan/GenerateArticleForm";
import { useDashboardMode } from "@/components/dashboard/DashboardModeProvider";
import { Button } from "@/components/ui/button";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { TaskExecutionCapability } from "@/lib/tasks/execution-capability";
import type { TaskListItem } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskExecutionPanelProps = {
  task: TaskListItem;
  capability: TaskExecutionCapability;
  websiteId?: string;
  compact?: boolean;
  actionLoading?: boolean;
  showPrepareFixNote?: boolean;
  prepareFixPreview?: string | null;
  prepareFixSuccess?: boolean;
  prepareFixLoading?: boolean;
  hermesFallbackWarning?: boolean;
  showExistingPreparedFix?: boolean;
  onPrepareFixClick?: () => void;
  onRegenerateFixClick?: () => void;
  onMarkDone?: () => void;
  onMarkInProgress?: () => void;
  onSkip?: () => void;
  onDraftCreated?: (articleId: string) => void;
  className?: string;
};

const modeStyles = {
  MANUAL: "border-slate-200 bg-slate-50 text-slate-700",
  REVIEW: "border-violet-200 bg-violet-50 text-violet-800",
  AUTOPILOT: "border-emerald-200 bg-emerald-50 text-emerald-800",
} as const;

export function TaskExecutionPanel({
  task,
  capability,
  websiteId,
  compact = false,
  actionLoading = false,
  showPrepareFixNote = false,
  prepareFixPreview = null,
  prepareFixSuccess = false,
  prepareFixLoading = false,
  hermesFallbackWarning = false,
  showExistingPreparedFix = false,
  onPrepareFixClick,
  onRegenerateFixClick,
  onMarkDone,
  onMarkInProgress,
  onSkip,
  onDraftCreated,
  className,
}: TaskExecutionPanelProps) {
  const { dict } = useSaasTranslations();
  const t = dict.tasksPage.execution;
  const { isAdvanced } = useDashboardMode();

  const primaryLabel = t.actions[capability.primaryAction];
  const simpleHint = t.simpleHints[capability.simpleHintKey];
  const modeLabel = t.modes[capability.mode];
  const requirementLabel =
    capability.integrationRequired === "WORDPRESS"
      ? t.requirements.wordpress
      : capability.integrationRequired === "GSC"
        ? t.requirements.gsc
        : capability.canRankBoostHelp
          ? t.requirements.reviewApproval
          : t.requirements.manual;

  const showDraftForm =
    capability.primaryAction === "CREATE_DRAFT" &&
    showPrepareFixNote &&
    websiteId;

  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4",
        compact ? "space-y-3" : "space-y-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-medium",
            modeStyles[capability.mode]
          )}
        >
          {modeLabel}
        </span>
        {isAdvanced ? (
          <span className="text-xs text-slate-500">
            {t.defaultModeLabel}: {t.modes[capability.defaultMode]}
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900">
          {capability.canRankBoostHelp ? t.canRankBoostYes : t.canRankBoostNo}
        </p>
        <p className="text-sm text-slate-600">{isAdvanced ? requirementLabel : simpleHint}</p>
      </div>

      {isAdvanced && task.auditCheckCode ? (
        <p className="text-xs text-slate-500">
          {t.auditCheckLabel}: {task.auditCheckCode}
        </p>
      ) : null}

      {showPrepareFixNote && capability.primaryAction === "PREPARE_FIX" ? (
        <div className="space-y-3">
          {prepareFixLoading ? (
            <div className="rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-3 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t.prepareFixLoading}
              </span>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-3 text-sm text-slate-700">
                {showExistingPreparedFix
                  ? t.existingFixTitle
                  : prepareFixSuccess
                    ? t.prepareFixSuccess
                    : t.prepareFixSafeNote}
              </div>
              {hermesFallbackWarning ? (
                <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-3 text-sm text-amber-900">
                  {t.hermesFallbackWarning}
                </div>
              ) : null}
              {prepareFixPreview ? (
                <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-700">
                  {prepareFixPreview}
                </p>
              ) : null}
              {showExistingPreparedFix || prepareFixSuccess ? (
                <div className="flex flex-col gap-2">
                  <Button
                    render={<Link href="/app/review" />}
                    nativeButton={false}
                    variant="outline"
                    className="w-full border-violet-200 text-violet-800"
                  >
                    {t.openReviewQueue}
                  </Button>
                  {onRegenerateFixClick ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={prepareFixLoading}
                      onClick={onRegenerateFixClick}
                      className="w-full text-slate-500"
                    >
                      {t.regenerateFix}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {showDraftForm ? (
        <GenerateArticleForm
          websiteId={websiteId}
          taskId={task.id}
          defaultTopic={task.title}
          submitLabel={t.actions.CREATE_DRAFT}
          onSuccess={onDraftCreated}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {capability.primaryAction === "CONNECT_WORDPRESS" ? (
            <Button
              render={<Link href="/app/integrations" />}
              nativeButton={false}
              className="w-full bg-blue-600 text-white hover:bg-blue-500"
            >
              {primaryLabel}
            </Button>
          ) : capability.primaryAction === "CONNECT_GSC" ? (
            <Button
              render={<Link href="/app/integrations" />}
              nativeButton={false}
              className="w-full bg-blue-600 text-white hover:bg-blue-500"
            >
              {primaryLabel}
            </Button>
          ) : capability.primaryAction === "PREPARE_FIX" ? (
            !prepareFixLoading &&
            !showExistingPreparedFix &&
            !(showPrepareFixNote && prepareFixSuccess) ? (
              <Button
                type="button"
                disabled={actionLoading || prepareFixLoading}
                onClick={onPrepareFixClick}
                className="w-full bg-violet-600 text-white hover:bg-violet-500"
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {primaryLabel}
              </Button>
            ) : null
          ) : capability.primaryAction === "CREATE_DRAFT" ? (
            <Button
              type="button"
              disabled={actionLoading}
              onClick={onPrepareFixClick}
              className="w-full bg-violet-600 text-white hover:bg-violet-500"
            >
              {primaryLabel}
            </Button>
          ) : capability.primaryAction === "MARK_DONE" ? (
            <Button
              type="button"
              disabled={actionLoading}
              onClick={onMarkDone}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {primaryLabel}
            </Button>
          ) : null}

          {capability.autopilotAvailable ? (
            <Button
              type="button"
              disabled
              variant="outline"
              className="w-full border-slate-200 bg-slate-50 text-slate-400"
              title={t.autopilotDisabledHint}
            >
              {t.actions.RUN_AUTOMATICALLY}
            </Button>
          ) : null}

          {!compact && onMarkDone && capability.primaryAction !== "MARK_DONE" ? (
            <Button
              type="button"
              variant="outline"
              disabled={actionLoading}
              onClick={onMarkDone}
              className="w-full border-slate-200 bg-white text-slate-700"
            >
              {dict.tasksPage.markDone}
            </Button>
          ) : null}

          {!compact && onMarkInProgress && task.status.toLowerCase() === "open" ? (
            <Button
              type="button"
              variant="ghost"
              disabled={actionLoading}
              onClick={onMarkInProgress}
              className="w-full text-slate-500"
            >
              {dict.tasksPage.markInProgress}
            </Button>
          ) : null}

          {!compact && onSkip ? (
            <Button
              type="button"
              variant="ghost"
              disabled={actionLoading}
              onClick={onSkip}
              className="w-full text-slate-500"
            >
              {dict.tasksPage.skipTask}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
