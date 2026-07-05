"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe } from "lucide-react";

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
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { AI_DRAFT_SAFETY_COPY, PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";

export function SimpleDashboardPage() {
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
            await parseApiErrorMessage(
              response,
              "Could not generate the monthly plan right now."
            )
          );
          return;
        }
        await refetch({ silent: true });
      } catch {
        setActionError("Network error while generating the plan.");
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
          setActionError(
            await parseApiErrorMessage(response, "Could not run the audit.")
          );
          return;
        }
        await refetch({ silent: true });
      } catch {
        setActionError("Network error while running the audit.");
      } finally {
        setActionLoading(false);
      }
    }
  }

  if (loading) {
    return <PageLoadingState message="Loading your growth overview…" />;
  }

  if (error || !simple) {
    return (
      <PageErrorState
        message={error ?? PAGE_ERROR_FALLBACK}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!simple.website) {
    return (
      <main className="app-content mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <DashboardHero status={simple.status} />
        <div className="mt-6">
          <EmptyState
            icon={Globe}
            title="Add your website to start finding growth opportunities"
            description="RankBoost needs your website URL before it can scan, plan, and prepare actions."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/app/onboarding"
                  className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Add website
                </Link>
                <Link
                  href="/app/onboarding"
                  className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  Open setup
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
      ? `${simple.metrics.opportunitiesCount} found`
      : "None yet";

  const reviewDisplay =
    simple.metrics.needsReviewCount > 0
      ? `${simple.metrics.needsReviewCount} item${simple.metrics.needsReviewCount === 1 ? "" : "s"}`
      : "All clear";

  const nextAction = simple.nextBestAction;
  const nextHref =
    nextAction?.href ??
    (nextAction?.apiAction === "generate_monthly_plan"
      ? "/app/autopilot"
      : undefined);

  return (
    <main className="app-content mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:max-w-4xl lg:px-8">
      <div className="space-y-6">
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

        <section className="grid gap-4 sm:grid-cols-3">
          <DashboardMetricCard
            title="Growth Score"
            value={growthScoreDisplay}
            subtitle={simple.metrics.growthScoreLabel}
            accent="emerald"
          />
          <DashboardMetricCard
            title="Opportunities"
            value={opportunitiesDisplay}
            subtitle="Tasks and growth ideas RankBoost found"
            accent="cyan"
          />
          <DashboardMetricCard
            title="Needs review"
            value={reviewDisplay}
            subtitle="Plans, drafts, and emails waiting for you"
            accent="amber"
          />
        </section>

        <FindingsCard findings={simple.findings} />

        <div className="grid gap-6 lg:grid-cols-2">
          <PreparedForYouCard {...simple.preparedForYou} />
          <RecentActivityCompact items={simple.recentActivity} />
        </div>

        <TrustNote variant="ai">{AI_DRAFT_SAFETY_COPY}</TrustNote>

        {simple.billingNote ? (
          <p className="text-center text-xs text-slate-500">
            {simple.billingNote}{" "}
            <Link href="/app/billing" className="text-blue-300 hover:text-blue-200">
              View plans
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
