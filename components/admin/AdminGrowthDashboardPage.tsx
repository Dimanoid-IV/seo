"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Globe2,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Users,
} from "lucide-react";

import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { AdminGrowthDashboardData } from "@/lib/admin/growth-dashboard";
import { cn } from "@/lib/utils";

type ApiResponse = {
  data: AdminGrowthDashboardData;
};

const PERIODS = [7, 30, 90] as const;

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function percentLabel(value: number | null): string {
  return value == null ? "—" : `${value}%`;
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof Users;
}) {
  return (
    <article className="rounded-2xl border border-[#999999]/25 bg-white p-5 shadow-[var(--shadow-md-protopie)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#999999]">
            {label}
          </p>
          <p className="mt-3 font-[var(--font-gilroy)] text-3xl font-bold text-black">
            {value}
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#c9bfff]/25 text-[#8169ff]">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[#555555]">{hint}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "COMPLETED";
  const failed = status === "FAILED";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        ok && "border-[#c9bfff]/55 bg-[#c9bfff]/20 text-[#6d4ff0]",
        failed && "border-red-200 bg-red-50 text-red-700",
        !ok && !failed && "border-[#999999]/25 bg-white text-[#555555]"
      )}
    >
      {status}
    </span>
  );
}

export function AdminGrowthDashboardPage() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AdminGrowthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const load = useCallback(async (nextDays: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(`/api/admin/dashboard?days=${nextDays}`);
      if (!response.ok) {
        setError(
          await parseApiErrorMessage(
            response,
            "Не удалось загрузить админ-дашборд."
          )
        );
        return;
      }

      const body = (await response.json()) as ApiResponse;
      setData(body.data);
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setLoading(false);
    }
  }, []);

  const runAdminAction = useCallback(async (key: string, body: Record<string, unknown>) => {
    setRunningAction(key);
    setError(null);
    try {
      const response = await authFetch("/api/admin/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, "Операция Autopilot не выполнена."));
        return;
      }
      await load(days);
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setRunningAction(null);
    }
  }, [days, load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(days);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [days, load]);

  const periodLabel = useMemo(() => `Последние ${days} дней`, [days]);

  if (loading && !data) {
    return <PageLoadingState message="Загружаю админ-дашборд..." />;
  }

  if (error && !data) {
    return (
      <PageErrorState
        message={error}
        retryLabel="Обновить"
        onRetry={() => void load(days)}
      />
    );
  }

  if (!data) return null;

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Простой дашборд роста"
        subtitle="Сколько людей зарегистрировались, добавили сайт и дошли до анализа."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-[#999999]/25 bg-white p-1">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDays(period)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                days === period
                  ? "bg-[#8169ff] text-white"
                  : "text-[#555555] hover:bg-black/[0.04]"
              )}
            >
              {period} дней
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-[#999999]/25 bg-white text-[#181818]"
          onClick={() => void load(days)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Обновить
        </Button>
      </div>

      {error ? (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Новые пользователи"
          value={data.period.newUsers}
          hint={`${periodLabel}. Всего пользователей: ${data.totals.users}.`}
          icon={Users}
        />
        <MetricCard
          label="Добавили сайт"
          value={data.period.usersAddedWebsite}
          hint={`${data.period.newWebsites} новых сайтов. Конверсия от регистраций: ${percentLabel(data.period.signupToWebsiteConversion)}.`}
          icon={Globe2}
        />
        <MetricCard
          label="Сделали анализ"
          value={data.period.usersCompletedAudit}
          hint={`${data.period.completedAudits} завершённых аудитов. Конверсия от сайтов: ${percentLabel(data.period.websiteToAuditConversion)}.`}
          icon={CheckCircle2}
        />
        <MetricCard
          label="Ошибки анализа"
          value={data.period.failedAudits}
          hint={`Сайтов с завершённым аудитом: ${data.period.auditedWebsites}. Всего аудитов: ${data.totals.completedAudits}.`}
          icon={Activity}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-[#999999]/25 bg-white p-5 shadow-[var(--shadow-md-protopie)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#999999]">Autopilot operations</p>
            <h2 className="mt-2 font-[var(--font-gilroy)] text-xl font-bold text-black">Очередь, cron и публикации</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">Waiting: {data.autopilot.queueByStatus.WAITING ?? 0}</span>
            <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">Failed: {data.autopilot.queueByStatus.FAILED ?? 0}</span>
            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">AI errors: {data.autopilot.failedAiJobs}</span>
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-700">Integration errors: {data.autopilot.integrationErrors}</span>
          </div>
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-black">Последние cron runs</h3>
            <div className="mt-2 space-y-2">
              {data.autopilot.latestCronRuns.length === 0 ? <p className="text-sm text-[#777]">Запусков пока нет.</p> : data.autopilot.latestCronRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2 text-sm">
                  <div><p className="font-medium">{run.jobKey}</p><p className="text-xs text-[#777]">{formatDate(run.startedAt)} · {run.durationMs == null ? "running" : `${run.durationMs} ms`}</p></div>
                  <StatusBadge status={run.status} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-black">Failed jobs</h3>
            <div className="mt-2 space-y-2">
              {data.autopilot.failedJobs.length === 0 ? <p className="text-sm text-[#777]">Нет упавших jobs.</p> : data.autopilot.failedJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/40 px-3 py-2 text-sm">
                  <div className="min-w-0"><p className="truncate font-medium">{job.websiteLabel} · {job.action}</p><p className="truncate text-xs text-red-700">{job.errorCode ?? job.errorMessage ?? "execution_failed"}</p></div>
                  <Button size="sm" variant="outline" disabled={runningAction === job.id} onClick={() => void runAdminAction(job.id, { action: "RETRY_JOB", jobId: job.id })}>
                    {runningAction === job.id ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Retry
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#999999]/25 bg-white p-5 shadow-[var(--shadow-md-protopie)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#999999]">
              Воронка
            </p>
            <h2 className="mt-2 font-[var(--font-gilroy)] text-xl font-bold text-black">
              Регистрация → сайт → анализ
            </h2>
          </div>
          <BarChart3 className="size-5 text-[#8169ff]" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[#999999]/20 p-4">
            <p className="text-sm text-[#555555]">Регистрация → сайт</p>
            <p className="mt-2 text-2xl font-bold text-black">
              {percentLabel(data.period.signupToWebsiteConversion)}
            </p>
          </div>
          <div className="rounded-xl border border-[#999999]/20 p-4">
            <p className="text-sm text-[#555555]">Сайт → анализ</p>
            <p className="mt-2 text-2xl font-bold text-black">
              {percentLabel(data.period.websiteToAuditConversion)}
            </p>
          </div>
          <div className="rounded-xl border border-[#999999]/20 p-4">
            <p className="text-sm text-[#555555]">Регистрация → анализ</p>
            <p className="mt-2 text-2xl font-bold text-black">
              {percentLabel(data.period.signupToAuditConversion)}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#999999]/25 bg-white p-5 shadow-[var(--shadow-md-protopie)]">
          <h2 className="font-[var(--font-gilroy)] text-xl font-bold text-black">
            Последние добавленные сайты
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[#999999]">
                <tr>
                  <th className="py-2 pr-3">Сайт</th>
                  <th className="py-2 pr-3">Добавлен</th>
                  <th className="py-2 pr-3">Аудит</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Autopilot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#999999]/15">
                {data.recentWebsites.map((website) => (
                  <tr key={website.id}>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-[#181818]">{website.host}</p>
                      <p className="text-xs text-[#999999]">{website.organizationName}</p>
                    </td>
                    <td className="py-3 pr-3 text-[#555555]">
                      {formatDate(website.createdAt)}
                    </td>
                    <td className="py-3 pr-3 text-[#555555]">
                      {formatDate(website.lastAuditAt)}
                    </td>
                    <td className="py-3 text-[#181818]">
                      {website.currentGrowthScore ?? "—"}
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="outline" disabled={runningAction === website.id} onClick={() => void runAdminAction(website.id, { action: "RUN_CYCLE", websiteId: website.id })}>
                        {runningAction === website.id ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[#999999]/25 bg-white p-5 shadow-[var(--shadow-md-protopie)]">
          <h2 className="font-[var(--font-gilroy)] text-xl font-bold text-black">
            Последние анализы сайта
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[#999999]">
                <tr>
                  <th className="py-2 pr-3">Сайт</th>
                  <th className="py-2 pr-3">Статус</th>
                  <th className="py-2 pr-3">Создан</th>
                  <th className="py-2">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#999999]/15">
                {data.recentAudits.map((audit) => (
                  <tr key={audit.id}>
                    <td className="py-3 pr-3 font-medium text-[#181818]">
                      {audit.websiteHost}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={audit.status} />
                    </td>
                    <td className="py-3 pr-3 text-[#555555]">
                      {formatDate(audit.createdAt)}
                    </td>
                    <td className="py-3 text-[#181818]">
                      {audit.growthScore ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
