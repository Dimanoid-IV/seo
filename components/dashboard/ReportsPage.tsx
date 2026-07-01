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
import { PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";
import { authFetch } from "@/lib/auth/client-session";
import { formatRelativeTime } from "@/lib/dashboard/display";
import type { DashboardOverviewGrowthHistoryEntry } from "@/lib/dashboard/overview";
import type { ReportsOverviewData } from "@/lib/reports/types";

async function fetchReportsOverview(): Promise<{
  data: ReportsOverviewData | null;
  error: string | null;
}> {
  try {
    const response = await authFetch("/api/reports/overview");

    if (!response.ok) {
      return { data: null, error: "Не удалось загрузить отчёты" };
    }

    const body = (await response.json()) as { data: ReportsOverviewData };
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: "Сетевая ошибка при загрузке отчётов" };
  }
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  monthly: "Месячный",
  audit: "Аудит",
  mid_month: "Середина месяца",
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  ready: "Готов",
  sent: "Отправлен",
  failed: "Ошибка",
};

export function ReportsPage() {
  const [data, setData] = useState<ReportsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      const result = await fetchReportsOverview();
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
  }, []);

  if (loading) {
    return <PageLoadingState message="Loading reports…" />;
  }

  if (error || !data) {
    return (
      <PageErrorState
        message={error ?? PAGE_ERROR_FALLBACK}
        onRetry={() => {
          void fetchReportsOverview().then((result) => {
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
        <PageHeader
          title="Reports"
          subtitle="Track website growth and share progress with clear summaries."
        />
        <EmptyState
          icon={Globe}
          title="Add a website to start tracking growth opportunities"
          description="Reports and growth history appear once your website is connected."
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
      <PageHeader
        title="Reports"
        subtitle="Track website growth and share progress with clear summaries."
      />
      <p className="-mt-4 mb-8 text-xs text-slate-500">{data.website.url}</p>

      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Последний аудит</h2>
          {data.latestAudit ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ReportSummaryCard
                title="Growth Score"
                value={data.latestAudit.growthScore ?? "—"}
                subtitle={
                  data.latestAudit.completedAt
                    ? `Завершён ${formatRelativeTime(data.latestAudit.completedAt)}`
                    : undefined
                }
                hint={`Тип: ${data.latestAudit.type}`}
                icon={Search}
                accent="emerald"
              />
              <ReportSummaryCard
                title="Текущий score сайта"
                value={growthScore}
                subtitle="На основе последних проверок"
                accent="blue"
              />
              <ReportSummaryCard
                title="Статус аудита"
                value={data.latestAudit.status}
                subtitle="Последняя завершённая проверка"
                accent="violet"
              />
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="Аудит ещё не проводился"
              description="Запустите проверку на dashboard — отчёт появится здесь."
            />
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Прогресс</h2>
          <GrowthHistoryCard history={historyForChart} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Задачи</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReportSummaryCard
              title="Выполнено в этом месяце"
              value={data.taskStats.completedThisMonth}
              subtitle="Задачи, отмеченные как готовые"
              icon={CheckCircle2}
              accent="emerald"
            />
            <ReportSummaryCard
              title="Активные задачи"
              value={data.taskStats.activeCount}
              subtitle="Открытые и в работе"
              icon={ClipboardList}
              accent="amber"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Последние события</h2>
          <ReportActivityList activities={data.lastActivities} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Сохранённые отчёты</h2>
          {data.reports.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.reports.map((report) => (
                <article
                  key={report.id}
                  className="glass-card flex flex-col gap-2 border border-white/5 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                      {REPORT_TYPE_LABELS[report.type] ?? report.type}
                    </span>
                    <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                      {REPORT_STATUS_LABELS[report.status] ?? report.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white">{report.title}</h3>
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
              title="Сохранённых отчётов пока нет"
              description="Готовые отчёты появятся здесь после генерации месячного плана."
            />
          )}
        </section>
      </div>
    </main>
  );
}
