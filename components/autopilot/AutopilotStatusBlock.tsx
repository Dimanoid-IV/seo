"use client";

import Link from "next/link";
import { CalendarClock, Loader2, Play, Shield, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AutopilotStatusSnapshot } from "@/lib/autopilot/autopilot-status";
import { findDuePlanItems } from "@/lib/autopilot/execution-eligibility";
import type { AutopilotPlanItemsDocument } from "@/lib/autopilot/plan-item-types";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { cn } from "@/lib/utils";

type AutopilotModeClient =
  | "off"
  | "review_first"
  | "approved_plan_autopilot"
  | "autopublish";

type AutopilotStatusBlockProps = {
  status: AutopilotStatusSnapshot;
  settingsMode: string;
  autopublishAvailable?: boolean;
  websiteId?: string | null;
  planItems?: AutopilotPlanItemsDocument | null;
  planPublishingMode?: "REVIEW_ONLY" | "AUTO_PUBLISH" | string | null;
  livePublishKillSwitchEngaged?: boolean;
  livePublishPaused?: boolean;
  onModeChange?: (mode: string) => void;
  onRunDue?: () => void;
  onPauseChange?: () => void;
  compact?: boolean;
};

function formatScheduledDate(iso: string, locale: SaasLocale): string {
  const intlLocale = locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

const MODE_OPTIONS: AutopilotModeClient[] = [
  "off",
  "review_first",
  "approved_plan_autopilot",
  "autopublish",
];

export function AutopilotStatusBlock({
  status,
  settingsMode,
  autopublishAvailable = false,
  websiteId,
  planItems,
  planPublishingMode = null,
  livePublishKillSwitchEngaged = true,
  livePublishPaused = false,
  onModeChange,
  onRunDue,
  onPauseChange,
  compact = false,
}: AutopilotStatusBlockProps) {
  const { dict, locale } = useSaasTranslations();
  const t = dict.autopilot.statusBlock;
  const [optimisticMode, setOptimisticMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [runningDue, setRunningDue] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [pausedOverride, setPausedOverride] = useState<boolean | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mode = optimisticMode ?? settingsMode;
  const paused = pausedOverride ?? livePublishPaused;

  const dueCount = useMemo(
    () => (planItems?.items ? findDuePlanItems(planItems.items).length : 0),
    [planItems]
  );

  const nextLivePublish = useMemo(() => {
    if (planPublishingMode !== "AUTO_PUBLISH" || !planItems?.items) return null;
    const candidates = planItems.items
      .filter(
        (item) =>
          item.type === "ARTICLE" &&
          item.status !== "published" &&
          item.status !== "executed" &&
          item.status !== "skipped" &&
          item.scheduledFor
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledFor!).getTime() -
          new Date(b.scheduledFor!).getTime()
      );
    return candidates[0] ?? null;
  }, [planItems, planPublishingMode]);

  const canRunDue =
    mode !== "off" &&
    dueCount > 0 &&
    (status.planApprovalStatus === "approved" ||
      status.planApprovalStatus === "partial");

  async function handleModeChange(nextMode: AutopilotModeClient) {
    if (nextMode === "autopublish" && !autopublishAvailable) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await authFetch("/api/autopilot/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: nextMode,
          websiteId: websiteId ?? undefined,
        }),
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.modeChangeFailed));
        setOptimisticMode(null);
        return;
      }

      setOptimisticMode(nextMode);
      onModeChange?.(nextMode);
    } catch {
      setOptimisticMode(null);
      setError(t.modeChangeNetworkError);
    } finally {
      setSaving(false);
    }
  }

  async function handlePauseToggle() {
    setPausing(true);
    setError(null);
    try {
      const response = await authFetch(
        paused ? "/api/autopilot/resume" : "/api/autopilot/pause",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            websiteId: websiteId ?? undefined,
          }),
        }
      );
      if (!response.ok) {
        setError(
          await parseApiErrorMessage(
            response,
            paused ? t.resumeFailed : t.pauseFailed
          )
        );
        return;
      }
      setPausedOverride(!paused);
      onPauseChange?.();
    } catch {
      setError(paused ? t.resumeNetworkError : t.pauseNetworkError);
    } finally {
      setPausing(false);
    }
  }

  async function handleRunDue(dryRun: boolean) {
    setRunningDue(true);
    setError(null);
    setRunMessage(null);

    try {
      const response = await authFetch("/api/autopilot/run-due", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun,
          websiteId: websiteId ?? undefined,
        }),
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.runDueNowFailed));
        return;
      }

      const body = (await response.json()) as {
        data: {
          dryRun: boolean;
          dueItemsFound: number;
          executedCount: number;
          skippedCount: number;
          blockedCount: number;
        };
      };

      if (body.data.dryRun) {
        setRunMessage(
          t.dryRunSuccess(
            body.data.executedCount,
            body.data.skippedCount,
            body.data.blockedCount
          )
        );
      } else {
        setRunMessage(
          t.runDueNowSuccess(body.data.executedCount, body.data.skippedCount)
        );
        onRunDue?.();
      }
    } catch {
      setError(t.runDueNowNetworkError);
    } finally {
      setRunningDue(false);
    }
  }

  const blockedMessages = status.blockedReasonKeys.map(
    (key) => t.blockedReasons[key as keyof typeof t.blockedReasons] ?? key
  );

  return (
    <section
      className={cn(
        "rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-slate-50 to-emerald-50/40 p-5 sm:p-6",
        compact && "p-4"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
          </div>
          <p className="text-sm text-slate-600">{t.approvalHint}</p>

          {paused ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <p className="font-medium">{t.livePublishPausedBanner}</p>
              <p className="mt-1 text-xs text-amber-800">
                {t.pauseLivePublishOnlyNote}
              </p>
            </div>
          ) : null}

          {(planPublishingMode === "AUTO_PUBLISH" ||
            mode === "autopublish" ||
            paused) && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={paused ? "default" : "outline"}
                size="sm"
                disabled={pausing || !websiteId}
                onClick={() => void handlePauseToggle()}
              >
                {pausing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Shield className="size-4" />
                )}
                {paused ? t.resumeAutopilotCta : t.pauseAutopilotCta}
              </Button>
              {!paused ? (
                <p className="text-xs text-slate-500">
                  {t.pauseLivePublishOnlyNote}
                </p>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {MODE_OPTIONS.map((option) => {
              const disabled =
                option === "autopublish" && !autopublishAvailable;
              const active = mode === option;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled || saving}
                  onClick={() => void handleModeChange(option)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                    active
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-violet-300",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  {t.modes[option]}
                  {option === "autopublish" && disabled ? ` (${t.comingSoon})` : ""}
                </button>
              );
            })}
            {saving ? (
              <Loader2 className="size-4 animate-spin self-center text-violet-500" />
            ) : null}
          </div>
        </div>

        <div className="min-w-[220px] space-y-3 rounded-xl border border-slate-200/80 bg-white/80 p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {t.currentMode}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {t.modes[mode as AutopilotModeClient] ?? mode}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {t.planApprovalStatus}
            </p>
            <p className="mt-1 text-sm text-slate-800">
              {t.planApprovalStatuses[status.planApprovalStatus]}
            </p>
          </div>

          {planPublishingMode ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {t.planPublishingModeLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {planPublishingMode === "AUTO_PUBLISH"
                  ? t.planModeAutoPublish
                  : t.planModeReviewOnly}
              </p>
            </div>
          ) : null}

          {planPublishingMode === "AUTO_PUBLISH" ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {t.nextLivePublishLabel}
              </p>
              {nextLivePublish?.scheduledFor ? (
                <div className="mt-1">
                  <p className="text-sm font-medium text-slate-900">
                    {nextLivePublish.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatScheduledDate(nextLivePublish.scheduledFor, locale)}
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  {t.noLivePublishScheduled}
                </p>
              )}
            </div>
          ) : null}

          {livePublishKillSwitchEngaged &&
          planPublishingMode === "AUTO_PUBLISH" ? (
            <p className="text-xs leading-relaxed text-amber-800">
              {t.killSwitchPausedNote}
            </p>
          ) : null}

          {dueCount > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                {t.dueNow}
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-800">
                {t.dueItemsCount(dueCount)}
              </p>
            </div>
          ) : null}

          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <CalendarClock className="size-3.5" />
              {t.nextScheduled}
            </p>
            {status.nextScheduledItem ? (
              <div className="mt-1">
                <p className="text-sm font-medium text-slate-900">
                  {status.nextScheduledItem.title}
                </p>
                <p className="text-xs text-slate-500">
                  {formatScheduledDate(status.nextScheduledItem.scheduledFor, locale)}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">{t.noApprovedActions}</p>
            )}
          </div>
        </div>
      </div>

      {blockedMessages.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {blockedMessages.map((message) => (
            <span
              key={message}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-900"
            >
              <Shield className="size-3.5 shrink-0" />
              {message}
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}
      {runMessage ? (
        <p className="mt-3 text-sm text-emerald-700">{runMessage}</p>
      ) : null}

      {!compact ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            render={<Link href="/app/review" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 bg-white"
          >
            {t.openReviewQueue}
          </Button>
          {canRunDue ? (
            <>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="rounded-xl"
                disabled={runningDue || mode === "off"}
                onClick={() => void handleRunDue(false)}
              >
                {runningDue ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                {t.runDueNow}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 bg-white"
                disabled={runningDue || mode === "off"}
                onClick={() => void handleRunDue(true)}
              >
                {t.dryRunLabel}
              </Button>
            </>
          ) : null}
          {mode !== "off" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-amber-200 bg-amber-50 text-amber-900"
              disabled={saving}
              onClick={() => void handleModeChange("off")}
            >
              {t.pauseAutopilotCta}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
