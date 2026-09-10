"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { authFetch } from "@/lib/auth/client-session";
import type {
  ActivationState,
  ActivationStepKey,
  ActivationStepStatus,
} from "@/lib/onboarding/activation-types";
import { ACTIVATION_STEP_ORDER } from "@/lib/onboarding/activation-types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";
import { activationNeedsRecovery } from "@/lib/onboarding/activation-recovery";
import { getLaunchCopy } from "@/lib/onboarding/launch-copy";

type ActivationProgressCardProps = {
  initialActivation?: ActivationState | null;
  siteTechPlatform?: string | null;
  brandVoiceReady?: boolean;
  gscConnected?: boolean;
  poll?: boolean;
  onSettled?: () => Promise<unknown>;
};

function StepIcon({ status }: { status: ActivationStepStatus }) {
  if (status === "done" || status === "skipped") {
    return <CheckCircle2 className="size-4 text-emerald-600" />;
  }
  if (status === "in_progress") {
    return <Loader2 className="size-4 animate-spin text-[#8169ff]" />;
  }
  if (status === "failed" || status === "needs_action") {
    return <AlertCircle className="size-4 text-amber-600" />;
  }
  return <Circle className="size-4 text-slate-300" />;
}

export function ActivationProgressCard({
  initialActivation = null,
  siteTechPlatform = null,
  brandVoiceReady = false,
  gscConnected = false,
  poll = true,
  onSettled,
}: ActivationProgressCardProps) {
  const { dict, locale } = useSaasTranslations();
  const copy = getLaunchCopy(locale);
  const t = dict.dashboard.activation;
  const [polled, setPolled] = useState<ActivationState | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const [missing, setMissing] = useState(false);
  const inFlight = useRef(false);
  const notified = useRef<string | null>(null);

  const activation = polled ?? initialActivation;

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const response = await authFetch("/api/onboarding/activation");
      if (!response.ok) throw new Error("progress_unavailable");
      const body = (await response.json()) as {
        data: { activation: ActivationState | null };
      };
      setPolled(body.data.activation);
      setMissing(!body.data.activation);
      setConnectionFailed(false);
      const state = body.data.activation;
      if (state && ["done", "failed", "partial"].includes(state.status) && notified.current !== `${state.status}:${state.finishedAt}`) {
        notified.current = `${state.status}:${state.finishedAt}`;
        await onSettled?.();
      }
    } catch {
      setConnectionFailed(true);
    } finally {
      inFlight.current = false;
    }
  }, [onSettled]);

  useEffect(() => {
    if (!poll) return;
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    if (
      activation?.status === "done" ||
      activation?.status === "failed" ||
      activation?.status === "partial"
    ) {
      return () => window.clearTimeout(initialRefresh);
    }
    if (activation?.status !== "running" && activation?.status !== "idle") {
      return () => window.clearTimeout(initialRefresh);
    }
    const id = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(id);
    };
  }, [activation?.status, poll, refresh]);

  if (!activation || activation.status === "idle") {
    return null;
  }

  const stepLabel = (key: ActivationStepKey): string => {
    switch (key) {
      case "siteTech":
        return t.stepSiteTech;
      case "brandVoice":
        return t.stepBrandVoice;
      case "audit":
        return t.stepAudit;
      case "growth":
        return t.stepGrowth;
      case "topics":
        return t.stepTopics;
      case "monthlyPlan":
        return t.stepMonthlyPlan;
      default:
        return key;
    }
  };

  const showRetry =
    missing || (Boolean(polled || initialActivation?.startedAt) && activationNeedsRecovery(activation)) || activation.status === "failed" || activation.status === "partial";

  async function handleRetry() {
    setRetrying(true);
    setRetryFailed(false);
    try {
      const response = await authFetch("/api/onboarding/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retry: true, websiteId: activation?.websiteId }),
      });
      if (!response.ok) throw new Error("retry_failed");
      notified.current = null;
      await refresh();
    } catch {
      setRetryFailed(true);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <section aria-label={copy.progress} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>

      <ul aria-live="polite" className="mt-5 space-y-4">
        {ACTIVATION_STEP_ORDER.map((key) => {
          const step = activation.steps[key];
          const status = step?.status ?? "pending";
          return (
            <li key={key} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5">
                <StepIcon status={status} />
              </span>
              <span
                className={cn(
                  "text-slate-700",
                  status === "in_progress" && "font-medium text-slate-900"
                )}
              >
                {stepLabel(key)}
                {key === "siteTech" &&
                siteTechPlatform &&
                siteTechPlatform !== "unknown"
                  ? ` — ${t.platformHint(siteTechPlatform)}`
                  : null}
              </span>
            </li>
          );
        })}
      </ul>
      {connectionFailed ? <p role="status" className="mt-4 text-sm text-amber-800">{copy.connectionError}</p> : null}
      {retryFailed ? <p role="alert" className="mt-4 text-sm text-amber-800">{copy.retryError}</p> : null}
      {showRetry ? <p className="mt-4 text-sm text-amber-800">{copy.stalled}</p> : null}

      <div className="mt-4 space-y-1.5 text-xs text-slate-500">
        {brandVoiceReady ? <p>{t.brandVoiceReady}</p> : null}
        {!gscConnected ? <p>{t.gscLater}</p> : null}
        {activation.planBlockedReason === "needs_audit" ? (
          <p>{t.planNeedsAudit}</p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {activation.status === "done" ||
        activation.steps.monthlyPlan?.status === "done" ? (
          <Link
            href="/app/autopilot"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t.reviewPlan}
          </Link>
        ) : null}
        {showRetry ? (
          <button
            type="button"
            disabled={retrying}
            onClick={() => void handleRetry()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={cn("size-3.5", retrying && "animate-spin")}
            />
            {copy.retry}
          </button>
        ) : null}
      </div>
    </section>
  );
}
