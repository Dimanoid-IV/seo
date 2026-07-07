"use client";

import { useEffect, useState } from "react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type {
  AutopilotControlCenterViewModel,
  ControlCenterRecommendedAction,
} from "@/lib/autopilot-control/types";

import { ApprovalQueue } from "./ApprovalQueue";
import { ControlEmptyState } from "./ControlEmptyState";
import { ControlMetricsGrid } from "./ControlMetricsGrid";
import { ControlStatusHero } from "./ControlStatusHero";
import { IntegrationStatusPanel } from "./IntegrationStatusPanel";
import { MonthlyPlanPanel } from "./MonthlyPlanPanel";
import { RecentActivityPanel } from "./RecentActivityPanel";
import { RecommendedActionsPanel } from "./RecommendedActionsPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";

type ControlCenterResponse = {
  data: {
    controlCenter: AutopilotControlCenterViewModel;
  };
};

export function AutopilotControlPage() {
  const { dict, locale } = useSaasTranslations();
  const c = dict.controlCenter;
  const [data, setData] = useState<AutopilotControlCenterViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  async function loadControlCenter() {
    setError(null);

    try {
      const response = await authFetch("/api/autopilot-control");

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(
            response,
            await parseApiErrorMessage(response, c.loadFailed)
          )
        );
        return null;
      }

      const body = (await response.json()) as ControlCenterResponse;
      setData(body.data.controlCenter);
      return body.data.controlCenter;
    } catch {
      setError(c.loadNetworkError);
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      try {
        const response = await authFetch("/api/autopilot-control");
        if (!response.ok) {
          if (!cancelled) {
            setError(
              await parseApiErrorMessage(
                response,
                await parseApiErrorMessage(response, c.loadFailed)
              )
            );
            setLoading(false);
          }
          return;
        }
        const body = (await response.json()) as ControlCenterResponse;
        if (!cancelled) {
          setData(body.data.controlCenter);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(c.loadNetworkError);
          setLoading(false);
        }
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [locale, c.loadFailed, c.loadNetworkError]);

  async function handleGenerateMonthlyPlan() {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch("/api/autopilot/monthly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, c.actionFailed)
        );
        return;
      }

      await loadControlCenter();
      setSuccess(c.generateSuccess);
    } catch {
      setError(c.actionNetworkError);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApiAction(action: ControlCenterRecommendedAction) {
    setActionLoading(true);
    setLoadingActionId(action.id);
    setError(null);
    setSuccess(null);

    try {
      if (action.apiAction === "generate_monthly_plan") {
        const response = await authFetch("/api/autopilot/monthly/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          setError(
            await parseApiErrorMessage(response, c.actionFailed)
          );
          return;
        }

        setSuccess(c.generateSuccess);
      } else if (action.apiAction === "generate_email_approval") {
        const response = await authFetch("/api/email-approvals/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "MONTHLY_PLAN_REVIEW",
            source: "MONTHLY_AUTOPILOT",
          }),
        });

        if (!response.ok) {
          setError(
            await parseApiErrorMessage(response, c.actionFailed)
          );
          return;
        }

        setSuccess(c.emailDraftSuccess);
      }

      await loadControlCenter();
    } catch {
      setError(c.actionNetworkError);
    } finally {
      setActionLoading(false);
      setLoadingActionId(null);
    }
  }

  if (loading && !data) {
    return <PageLoadingState message={c.loading} />;
  }

  if (!data?.website) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <PageHeader title={c.title} subtitle={c.subtitle} />
        <ControlEmptyState variant="no-website" />
      </main>
    );
  }

  const showGeneratePlan = !data.monthlyPlan;

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader title={c.title} subtitle={c.subtitle} />
      <p className="-mt-4 mb-6 break-all text-xs text-slate-500">
        {data.website.name ?? data.website.domain}
      </p>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="saas-page-stack">
        <ControlStatusHero
          status={data.status}
          hasWebsite
          onGeneratePlan={showGeneratePlan ? handleGenerateMonthlyPlan : undefined}
          generating={actionLoading}
        />

        <ControlMetricsGrid metrics={data.metrics} />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <MonthlyPlanPanel
              plan={data.monthlyPlan}
              onGenerate={showGeneratePlan ? handleGenerateMonthlyPlan : undefined}
              generating={actionLoading}
            />
            <ApprovalQueue items={data.approvalQueue} />
          </div>

          <div className="space-y-8">
            <RecommendedActionsPanel
              actions={data.recommendedActions}
              onApiAction={handleApiAction}
              actionLoading={actionLoading}
              loadingActionId={loadingActionId}
            />
            <IntegrationStatusPanel integrations={data.integrations} />
          </div>
        </div>

        <RecentActivityPanel events={data.recentActivity} />

        {data.status.overall === "NO_DATA" ? (
          <ControlEmptyState variant="no-data" />
        ) : null}
      </div>
    </main>
  );
}
