"use client";

import Link from "next/link";
import { Loader2, RefreshCw, Search } from "lucide-react";

import { GscMetricsSummaryDisplay } from "@/components/integrations/GscMetricsSummary";
import { GscInsightsList } from "@/components/integrations/GscInsightsList";
import { formatRelativeTime } from "@/lib/dashboard/display";
import type { DashboardGoogleSearchConsole } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type GoogleSearchConsoleDashboardCardProps = {
  data: DashboardGoogleSearchConsole;
  className?: string;
};

export function GoogleSearchConsoleDashboardCard({
  data,
  className,
}: GoogleSearchConsoleDashboardCardProps) {
  return (
    <section
      className={cn(
        "glass-card border border-slate-200 p-5 sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
          <Search className="size-5 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">
            Google Search Console
          </h3>
          <p className="mt-1 text-xs text-slate-500">Последние 28 дней</p>
        </div>
      </div>

      {!data.connected ? (
        <p className="text-sm text-slate-400">
          Подключите Google Search Console, чтобы видеть реальные клики и показы.{" "}
          <Link
            href="/app/integrations"
            className="text-cyan-400 underline-offset-2 hover:underline"
          >
            Перейти к интеграциям
          </Link>
        </p>
      ) : !data.selectedProperty ? (
        <p className="text-sm text-slate-400">
          Выберите сайт Search Console в{" "}
          <Link
            href="/app/integrations"
            className="text-cyan-400 underline-offset-2 hover:underline"
          >
            интеграциях
          </Link>
          , чтобы загрузить метрики.
        </p>
      ) : data.metricsSummary ? (
        <div className="space-y-5">
          <p className="truncate text-xs text-slate-500">
            {data.selectedProperty}
            {data.lastFetchedAt
              ? ` · обновлено ${formatRelativeTime(data.lastFetchedAt)}`
              : ""}
          </p>
          <GscMetricsSummaryDisplay summary={data.metricsSummary} />
          <GscInsightsList
            insights={data.insights}
            showExplainer
          />
          {data.tasksCreatedLastSync != null && data.tasksCreatedLastSync > 0 ? (
            <p className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-sm text-violet-200">
              На основе этих данных создано{" "}
              <span className="font-semibold text-slate-900">
                {data.tasksCreatedLastSync}
              </span>{" "}
              новых задач. Смотрите в блоке «Главные улучшения».
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Сайт выбран. Загрузите данные в{" "}
          <Link
            href="/app/integrations"
            className="text-cyan-400 underline-offset-2 hover:underline"
          >
            интеграциях
          </Link>
          .
        </p>
      )}
    </section>
  );
}

type GscSyncButtonProps = {
  onSync: () => Promise<void>;
  loading?: boolean;
  label?: string;
  className?: string;
};

export function GscSyncButton({
  onSync,
  loading = false,
  label = "Обновить данные",
  className,
}: GscSyncButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void onSync()}
      disabled={loading}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Загружаем…
        </>
      ) : (
        <>
          <RefreshCw className="size-4" />
          {label}
        </>
      )}
    </button>
  );
}
