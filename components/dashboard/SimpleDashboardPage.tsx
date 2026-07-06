"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe } from "lucide-react";

import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { FindingsCard } from "@/components/dashboard/FindingsCard";
import { NextBestActionCard } from "@/components/dashboard/NextBestActionCard";
import { PreparedForYouCard } from "@/components/dashboard/PreparedForYouCard";
import { RecentActivityCompact } from "@/components/dashboard/RecentActivityCompact";
import { useDashboardOverview } from "@/components/dashboard/DashboardOverviewProvider";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { TrustNote } from "@/components/shared/TrustNote";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";

const DASHBOARD_MAIN =
  "app-content mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8";

export function SimpleDashboardPage() {
  const { dict } = useSaasTranslations();
  const d = dict.dashboard;
  const { overview, simple, loading, error, refetch } = useDashboardOverview();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handlePrimaryAction() {
    const action = simple?.nextBestAction;
    if (!action) {
      return;
    }

    if (action.href) {
      return;
    }

    if (action.apiAction === "generate_monthly_plan") {
      setActionLoading(true);
      setActionError(null);
      try {
        const response = await authFetch("/api/autopilot/monthly/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!response.ok) {
          setActionError(
            await parseApiErrorMessage(response, d.generatePlanFailed)
          );
          return;
        }
        await refetch({ silent: true });
      } catch {
        setActionError(d.generatePlanNetworkError);
      } finally {
        setActionLoading(false);
      }
      return;
    }

    if (action.apiAction === "generate_email_approval") {
      window.location.href = "/app/email-approvals";
      return;
    }

    if (overview?.website && action.label.toLowerCase().includes("audit")) {
      setActionLoading(true);
      setActionError(null);
      try {
        const response = await authFetch(
          `/api/websites/${overview.website.id}/audits/run`,
          { method: "POST" }
        );
        if (!response.ok) {
          setActionError(await parseApiErrorMessage(response, d.auditFailed));
          return;
        }
        await refetch({ silent: true });
      } catch {
        setActionError(d.auditNetworkError);
      } finally {
        setActionLoading(false);
      }
    }
  }

  if (loading) {
    return <PageLoadingState message={d.loading} />;
  }

  if (error || !simple) {
    return (
      <PageErrorState
        message={error ?? dict.trust.pageErrorFallback}
        onRetry={() => void refetch()}
        retryLabel={dict.common.tryAgain}
      />
    );
  }

  if (!simple.website) {
    return (
      <main className={DASHBOARD_MAIN}>
        <OnboardingBanner />
        <DashboardHero status={simple.status} />
        <div className="mt-6">
          <EmptyState
            icon={Globe}
            title={d.addWebsiteTitle}
            description={d.addWebsiteDescription}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/app/onboarding"
                  className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  {d.addWebsite}
                </Link>
                <Link
                  href="/app/onboarding"
                  className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  {d.openSetup}
                </Link>
              </div>
            }
          />
        </div>
      </main>
    );
  }

  const growthScoreDisplay =
    simple.metrics.growthScore != null
      ? `${simple.metrics.growthScore} / 100`
      : "—";

  const opportunitiesDisplay =
    simple.metrics.opportunitiesCount > 0
      ? `${simple.metrics.opportunitiesCount} ${d.found}`
      : d.noneYet;

  const reviewDisplay =
    simple.metrics.needsReviewCount > 0
      ? `${simple.metrics.needsReviewCount} ${
          simple.metrics.needsReviewCount === 1 ? d.item : d.items
        }`
      : d.allClear;

  const nextAction = simple.nextBestAction;
  const nextHref =
    nextAction?.href ??
    (nextAction?.apiAction === "generate_monthly_plan"
      ? "/app/autopilot"
      : undefined);

  return (
    <main className={DASHBOARD_MAIN}>
      <OnboardingBanner />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(360px,100%)] lg:items-start">
        <div className="saas-page-stack min-w-0">
          <DashboardHero
            status={simple.status}
            websiteDomain={simple.website.domain ?? simple.website.name}
          />

          {nextAction ? (
            <NextBestActionCard
              title={nextAction.title}
              description={nextAction.description}
              label={nextAction.label}
              href={nextHref}
              onAction={nextHref ? undefined : () => void handlePrimaryAction()}
              loading={actionLoading}
              secondaryLabel={simple.secondaryAction?.label}
              secondaryHref={simple.secondaryAction?.href}
            />
          ) : null}

          {actionError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {actionError}
            </div>
          ) : null}

          <section className="grid gap-5 sm:grid-cols-3">
            <DashboardMetricCard
              title={d.growthScore}
              value={growthScoreDisplay}
              subtitle={simple.metrics.growthScoreLabel}
              accent="emerald"
            />
            <DashboardMetricCard
              title={d.opportunities}
              value={opportunitiesDisplay}
              subtitle={d.opportunitiesSubtitle}
              accent="cyan"
            />
            <DashboardMetricCard
              title={d.needsReview}
              value={reviewDisplay}
              subtitle={d.needsReviewSubtitle}
              accent="amber"
            />
          </section>

          <FindingsCard findings={simple.findings} />

          <TrustNote variant="ai" />

          {simple.billingNote ? (
            <p className="text-center text-xs text-slate-500 lg:text-left">
              {d.billingNote}{" "}
              <Link href="/app/billing" className="text-blue-300 hover:text-blue-200">
                {dict.common.viewPlans}
              </Link>
            </p>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-6 self-start">
          <PreparedForYouCard {...simple.preparedForYou} />
          <RecentActivityCompact items={simple.recentActivity} />
        </aside>
      </div>
    </main>
  );
}
