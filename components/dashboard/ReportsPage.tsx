"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Globe,
  Search,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { GrowthHistoryCard } from "@/components/dashboard/GrowthHistoryCard";
import { ReportActivityList } from "@/components/dashboard/ReportActivityList";
import { ReportSummaryCard } from "@/components/dashboard/ReportSummaryCard";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { authFetch } from "@/lib/auth/client-session";
import { formatRelativeTime } from "@/lib/dashboard/display";
import type { DashboardOverviewGrowthHistoryEntry } from "@/lib/dashboard/overview";
import type { ReportsOverviewData } from "@/lib/reports/types";

async function fetchReportsOverview(
  loadFailed: string,
  loadNetworkError: string
): Promise<{
  data: ReportsOverviewData | null;
  error: string | null;
}> {
  try {
    const response = await authFetch("/api/reports/overview");

    if (!response.ok) {
      return { data: null, error: loadFailed };
    }

    const body = (await response.json()) as { data: ReportsOverviewData };
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: loadNetworkError };
  }
}

export function ReportsPage() {
  const { dict } = useSaasTranslations();
  const r = dict.reports;
  const [data, setData] = useState<ReportsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reportTypeLabels: Record<string, string> = {
    monthly: r.types.monthly,
    audit: r.types.audit,
    mid_month: r.types.midMonth,
  };

  const reportStatusLabels: Record<string, string> = {
    draft: r.statuses.draft,
    ready: r.statuses.ready,
    sent: r.statuses.sent,
    failed: r.statuses.failed,
  };

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      const result = await fetchReportsOverview(r.loadFailed, r.loadNetworkError);
      if (cancelled) {
        return;
      }
      setData(result.data);
      setError(result.error);
      setLoading(false);
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [r.loadFailed, r.loadNetworkError]);

  if (loading) {
    return <PageLoadingState message={dict.common.loading} />;
  }

  if (error || !data) {
    return (
      <PageErrorState
        message={error ?? dict.trust.pageErrorFallback}
        onRetry={() => {
          void fetchReportsOverview(r.loadFailed, r.loadNetworkError).then((result) => {
            setData(result.data);
            setError(result.error);
          });
        }}
      />
    );
  }

  if (!data.website) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader title={r.title} subtitle={r.subtitle} />
        <EmptyState
          icon={Globe}
          title={r.emptyNoWebsiteTitle}
          description={r.emptyNoWebsiteDescription}
        />
      </main>
    );
  }

  const growthScore =
    data.website.currentGrowthScore ?? data.latestAudit?.growthScore ?? "—";
  const historyForChart =
    data.growthHistory as DashboardOverviewGrowthHistoryEntry[];

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader title={r.title} subtitle={r.subtitle} />
      <p className="-mt-4 mb-8 text-xs text-slate-500">{data.website.url}</p>

      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{r.latestAudit}</h2>
          {data.latestAudit ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ReportSummaryCard
                title={r.growthScoreLabel}
                value={data.latestAudit.growthScore ?? "—"}
                subtitle={
                  data.latestAudit.completedAt
                    ? `${r.completedAt} ${formatRelativeTime(data.latestAudit.completedAt)}`
                    : undefined
                }
                hint={`${r.auditType}: ${data.latestAudit.type}`}
                icon={Search}
                accent="emerald"
              />
              <ReportSummaryCard
                title={r.currentScore}
                value={growthScore}
                subtitle={r.scoreBasedOn}
                accent="blue"
              />
              <ReportSummaryCard
                title={r.auditStatus}
                value={data.latestAudit.status}
                subtitle={r.lastCompleted}
                accent="violet"
              />
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title={r.noAuditTitle}
              description={r.noAuditDescription}
            />
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{r.progress}</h2>
          <GrowthHistoryCard history={historyForChart} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{r.tasks}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReportSummaryCard
              title={r.completedThisMonth}
              value={data.taskStats.completedThisMonth}
              subtitle={r.completedSubtitle}
              icon={CheckCircle2}
              accent="emerald"
            />
            <ReportSummaryCard
              title={r.activeTasks}
              value={data.taskStats.activeCount}
              subtitle={r.activeSubtitle}
              icon={ClipboardList}
              accent="amber"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{r.recentEvents}</h2>
          <ReportActivityList activities={data.lastActivities} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{r.savedReports}</h2>
          {data.reports.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.reports.map((report) => (
                <article
                  key={report.id}
                  className="glass-card flex flex-col gap-2 border border-slate-200 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-600">
                      {reportTypeLabels[report.type] ?? report.type}
                    </span>
                    <span className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-400">
                      {reportStatusLabels[report.status] ?? report.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900">{report.title}</h3>
                  {report.summary ? (
                    <p className="text-sm text-slate-400">{report.summary}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {formatRelativeTime(report.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title={r.noSavedTitle}
              description={r.noSavedDescription}
            />
          )}
        </section>
      </div>
    </main>
  );
}
