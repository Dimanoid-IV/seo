"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/billing/FeatureGate";
import {
  isUsageLimitReached,
  useBillingOverview,
} from "@/components/billing/useBillingOverview";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { MonthlyAutopilotGetResponse } from "@/lib/autopilot/types";

import { AutopilotEmptyState } from "./AutopilotEmptyState";
import { AutopilotGenerateButton } from "./AutopilotGenerateButton";
import { AutopilotMetricsGrid } from "./AutopilotMetricsGrid";
import { AutopilotNextSteps } from "./AutopilotNextSteps";
import { AutopilotRisksCard } from "./AutopilotRisksCard";
import { AutopilotStatusBlock } from "./AutopilotStatusBlock";
import { AutopilotSummaryCard } from "./AutopilotSummaryCard";
import { FocusAreaCard } from "./FocusAreaCard";
import { PlanApprovalPanel } from "./PlanApprovalPanel";
import { RecommendedActionCard } from "./RecommendedActionCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { SaasLocale } from "@/lib/i18n/saas/locales";

type AutopilotResponse = {
  data: MonthlyAutopilotGetResponse;
};

type GenerateResponse = {
  data: {
    plan: MonthlyAutopilotGetResponse["plan"];
    created: boolean;
    hermesSummaryUsed: boolean;
  };
};

function formatMonthLabel(monthKey: string, locale: SaasLocale): string {
  const [year, month] = monthKey.split("-");
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  const intlLocale = locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${nextMonth}`;
}

export function MonthlyAutopilotPage() {
  const { dict, locale } = useSaasTranslations();
  const a = dict.autopilot;
  const d = dict.dashboard;
  const { data: billing } = useBillingOverview();
  const autopilotLimit = isUsageLimitReached(billing, "monthly_autopilot");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `${now.getUTCFullYear()}-${m}`;
  });
  const [data, setData] = useState<MonthlyAutopilotGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async (targetMonth: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `/api/autopilot/monthly?month=${encodeURIComponent(targetMonth)}`
      );

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, a.loadPlanFailed)
        );
        return;
      }

      const body = (await response.json()) as AutopilotResponse;
      setData(body.data);
    } catch {
      setError(a.loadNetworkError);
    } finally {
      setLoading(false);
    }
  }, [a.loadPlanFailed, a.loadNetworkError]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialPlan() {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(
          `/api/autopilot/monthly?month=${encodeURIComponent(month)}`
        );

        if (!response.ok) {
          if (!cancelled) {
            setError(
              await parseApiErrorMessage(response, a.loadPlanFailed)
            );
            setLoading(false);
          }
          return;
        }

        const body = (await response.json()) as AutopilotResponse;
        if (!cancelled) {
          setData(body.data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(a.loadNetworkError);
          setLoading(false);
        }
      }
    }

    void loadInitialPlan();

    return () => {
      cancelled = true;
    };
  }, [month, locale, a.loadPlanFailed, a.loadNetworkError]);

  const emptyVariant = useMemo(() => {
    if (!data?.websiteId) {
      return "no-website" as const;
    }
    if (!data.sourceSummary?.hasEnoughData && !data.plan) {
      return "no-data" as const;
    }
    if (!data.plan) {
      return "no-plan" as const;
    }
    return null;
  }, [data]);

  const canRegenerate =
    data?.plan?.status === "draft" || data?.plan?.status === "ready";

  async function handleGenerate(forceRegenerate: boolean) {
    setGenerating(true);
    setError(null);

    try {
      const response = await authFetch("/api/autopilot/monthly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, forceRegenerate }),
      });

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, a.generateFailed)
        );
        return;
      }

      const body = (await response.json()) as GenerateResponse;
      setData((prev) => ({
        plan: body.data.plan,
        month,
        websiteId: prev?.websiteId ?? null,
        websiteUrl: prev?.websiteUrl ?? null,
        sourceSummary: prev?.sourceSummary ?? null,
        planItems: body.data.plan?.planItems ?? prev?.planItems ?? null,
        autopilotStatus: prev?.autopilotStatus,
        autopilotSettings: prev?.autopilotSettings,
      }));
      await loadPlan(month);
    } catch {
      setError(a.generateNetworkError);
    } finally {
      setGenerating(false);
    }
  }

  const monthLabel = formatMonthLabel(month, locale);

  if (loading && !data) {
    return <PageLoadingState message={a.loadingMonthly} />;
  }

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={a.monthlyTitle}
        subtitle={a.pageSubtitle}
        actions={
          data?.websiteId ? (
            <FeatureGate
              blocked={autopilotLimit.blocked}
              reason={autopilotLimit.message}
            >
              <AutopilotGenerateButton
                loading={generating}
                hasPlan={Boolean(data.plan)}
                canRegenerate={canRegenerate}
                blocked={autopilotLimit.blocked}
                onGenerate={handleGenerate}
              />
            </FeatureGate>
          ) : undefined
        }
      />

      <p className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-100/90">
        {a.reviewNote}
      </p>

      <div className="mb-8 flex items-center justify-center gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="border-slate-200 bg-transparent text-slate-600"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[140px] text-center text-sm font-medium text-slate-900">
          {monthLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="border-slate-200 bg-transparent text-slate-600"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-violet-400" />
        </div>
      ) : emptyVariant ? (
        <div className="space-y-6">
          <AutopilotEmptyState variant={emptyVariant} />
          {emptyVariant !== "no-website" ? (
            <div className="flex justify-center">
              <FeatureGate
                blocked={autopilotLimit.blocked}
                reason={autopilotLimit.message}
              >
                <AutopilotGenerateButton
                  loading={generating}
                  hasPlan={false}
                  canRegenerate={false}
                  blocked={autopilotLimit.blocked}
                  onGenerate={() => handleGenerate(false)}
                />
              </FeatureGate>
            </div>
          ) : null}
        </div>
      ) : data?.plan ? (
        <div className="space-y-8">
          {data.autopilotStatus && data.autopilotSettings ? (
            <AutopilotStatusBlock
              status={data.autopilotStatus}
              settingsMode={data.autopilotSettings.mode}
              autopublishAvailable={data.autopilotSettings.autopublishAvailable}
              websiteId={data.websiteId}
              planItems={data.planItems}
              onModeChange={() => void loadPlan(month)}
              onRunDue={() => void loadPlan(month)}
            />
          ) : null}

          <AutopilotSummaryCard plan={data.plan} monthLabel={monthLabel} />

          {data.planItems && data.planItems.items.length > 0 ? (
            <PlanApprovalPanel
              planId={data.plan.id}
              planItems={data.planItems}
              onApproved={() => void loadPlan(month)}
            />
          ) : null}

          <AutopilotMetricsGrid metrics={data.plan.metrics} />

          {data.plan.focusAreas.length > 0 ? (
            <section>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {d.focusAreas.title}
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {data.plan.focusAreas.map((area) => (
                  <FocusAreaCard key={area.id} area={area} />
                ))}
              </div>
            </section>
          ) : null}

          {data.plan.recommendedActions.length > 0 ? (
            <section>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {a.recommendedActions}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {data.plan.recommendedActions.map((action) => (
                  <RecommendedActionCard key={action.id} action={action} />
                ))}
              </div>
            </section>
          ) : null}

          <AutopilotRisksCard risks={data.plan.risks} />
          <AutopilotNextSteps steps={data.plan.nextSteps} />
        </div>
      ) : null}
    </main>
  );
}
