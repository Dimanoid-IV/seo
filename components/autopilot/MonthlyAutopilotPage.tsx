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
import { AutopilotSummaryCard } from "./AutopilotSummaryCard";
import { FocusAreaCard } from "./FocusAreaCard";
import { RecommendedActionCard } from "./RecommendedActionCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";

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

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat("en", {
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
          await parseApiErrorMessage(response, "Failed to load monthly plan")
        );
        return;
      }

      const body = (await response.json()) as AutopilotResponse;
      setData(body.data);
    } catch {
      setError("Network error while loading monthly plan");
    } finally {
      setLoading(false);
    }
  }, []);

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
              await parseApiErrorMessage(response, "Failed to load monthly plan")
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
          setError("Network error while loading monthly plan");
          setLoading(false);
        }
      }
    }

    void loadInitialPlan();

    return () => {
      cancelled = true;
    };
  }, [month]);

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
          await parseApiErrorMessage(response, "Failed to generate monthly plan")
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
      }));
    } catch {
      setError("Network error while generating monthly plan");
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove() {
    if (!data?.plan) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await authFetch(
        `/api/autopilot/monthly/${data.plan.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "APPROVED" }),
        }
      );

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, "Failed to approve monthly plan")
        );
        return;
      }

      await loadPlan(month);
    } catch {
      setError("Network error while approving monthly plan");
    } finally {
      setGenerating(false);
    }
  }

  const monthLabel = formatMonthLabel(month);

  if (loading && !data) {
    return <PageLoadingState message="Loading monthly plan…" />;
  }

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Monthly Autopilot"
        subtitle="Review RankBoost's monthly growth plan before anything is executed."
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

      <div className="mb-8 flex items-center justify-center gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="border-white/10 bg-transparent text-slate-300"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[140px] text-center text-sm font-medium text-white">
          {monthLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="border-white/10 bg-transparent text-slate-300"
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
          <AutopilotSummaryCard plan={data.plan} monthLabel={monthLabel} />

          {data.plan.status !== "approved" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={generating}
                onClick={() => void handleApprove()}
                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
              >
                Approve plan
              </Button>
            </div>
          ) : null}

          <AutopilotMetricsGrid metrics={data.plan.metrics} />

          {data.plan.focusAreas.length > 0 ? (
            <section>
              <h3 className="mb-4 text-lg font-semibold text-white">
                Focus areas
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
              <h3 className="mb-4 text-lg font-semibold text-white">
                Recommended actions
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
