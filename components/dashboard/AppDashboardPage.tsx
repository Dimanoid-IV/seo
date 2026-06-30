"use client";

import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { GrowthScoreGauge } from "@/components/dashboard/GrowthScoreGauge";
import { IntegrationStatusCard } from "@/components/dashboard/IntegrationStatusCard";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { UsageMeter } from "@/components/dashboard/UsageMeter";
import { useDashboardOverview } from "@/components/dashboard/DashboardOverviewProvider";
import {
  formatCheckCategory,
  formatRelativeTime,
  parseRecommendation,
  severityToTaskPriority,
} from "@/lib/dashboard/display";
import type { DashboardOverviewCheck } from "@/lib/dashboard/overview";
import {
  BarChart3,
  Globe,
  Loader2,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react";

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

function pickTopImprovements(checks: DashboardOverviewCheck[]) {
  return checks
    .filter((check) => check.status === "FAIL" || check.status === "WARNING")
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
    )
    .slice(0, 5);
}

function activityAccent(type: string): "blue" | "cyan" | "violet" | "emerald" | "amber" {
  if (type.includes("AUDIT")) {
    return "blue";
  }
  if (type.includes("GROWTH") || type.includes("SCORE")) {
    return "emerald";
  }
  if (type.includes("ARTICLE") || type.includes("CONTENT")) {
    return "cyan";
  }
  if (type.includes("TASK")) {
    return "violet";
  }
  return "amber";
}

export function AppDashboardPage() {
  const { overview, loading, error } = useDashboardOverview();

  if (loading) {
    return (
      <main className="app-content mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <Loader2 className="size-8 animate-spin text-blue-400" />
        <p className="mt-3 text-sm text-slate-400">Загружаем данные сайта…</p>
      </main>
    );
  }

  if (error || !overview) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <EmptyState
          icon={Globe}
          title="Не удалось загрузить кабинет"
          description={error ?? "Попробуйте обновить страницу"}
        />
      </main>
    );
  }

  if (!overview.website) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Обзор сайта</h2>
        </div>
        <EmptyState
          icon={Globe}
          title="Добавьте сайт, чтобы начать"
          description="Укажите URL сайта при регистрации или добавьте его позже в настройках."
        />
      </main>
    );
  }

  const growthScore =
    overview.website.currentGrowthScore ??
    overview.latestAudit?.growthScore ??
    0;
  const improvements = pickTopImprovements(overview.checks);
  const planLimit = overview.planLimit;
  const scoreDelta = overview.growthScoreDelta;
  const scoreTrend =
    scoreDelta != null && scoreDelta !== 0
      ? {
          value: `${scoreDelta > 0 ? "↑" : "↓"} ${Math.abs(scoreDelta)} за последний аудит`,
          positive: scoreDelta > 0,
        }
      : undefined;

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
          {overview.latestAudit?.type === "preview" ? "Preview-аудит" : "Аудит"}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Обзор сайта
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          {overview.website.url}
          {overview.website.lastAuditAt
            ? ` · последняя проверка ${formatRelativeTime(overview.website.lastAuditAt)}`
            : ""}
        </p>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <ScoreCard
          title="Growth Score"
          value={growthScore}
          subtitle={
            overview.latestAudit
              ? "На основе последнего аудита"
              : "Ожидается первый аудит"
          }
          trend={scoreTrend}
          icon={TrendingUp}
          accent="emerald"
        >
          <div className="flex justify-center pt-2">
            <GrowthScoreGauge score={growthScore} size="sm" />
          </div>
        </ScoreCard>

        <ScoreCard
          title="Органический трафик"
          value="—"
          subtitle="Прогноз появится после подключения Google"
          icon={Zap}
          accent="cyan"
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Главные улучшения</h3>
            <span className="text-xs text-slate-500">
              {improvements.length} рекомендаций
            </span>
          </div>
          {improvements.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
              {improvements.map((check) => (
                <TaskCard
                  key={`${check.code}-${check.title}`}
                  title={check.title}
                  description={
                    parseRecommendation(check.recommendationJson) ??
                    check.description ??
                    undefined
                  }
                  category={formatCheckCategory(check.category)}
                  priority={severityToTaskPriority(check.severity)}
                  status="open"
                  impactScore={check.scoreImpact ?? undefined}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-5 text-sm text-slate-400">
              Критичных проблем не найдено. Отличная база для роста.
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-white">Активность</h3>
          <div className="glass-card divide-y divide-white/5 px-4">
            {overview.activities.length > 0 ? (
              overview.activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  title={activity.title}
                  description={activity.description ?? undefined}
                  timestamp={formatRelativeTime(activity.createdAt)}
                  accent={activityAccent(activity.type)}
                />
              ))
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">
                Пока нет активности
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-white">Интеграции</h3>
          <div className="grid gap-3">
            <IntegrationStatusCard
              name="Google Search Console"
              provider="google_search_console"
              status="disconnected"
              icon={Search}
            />
            <IntegrationStatusCard
              name="Google Analytics 4"
              provider="google_analytics"
              status="disconnected"
              icon={BarChart3}
            />
            <IntegrationStatusCard
              name="WordPress"
              provider="wordpress"
              status="disconnected"
              icon={Globe}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Использование плана
          </h3>
          <div className="glass-card space-y-6 p-5">
            {planLimit ? (
              <>
                <UsageMeter
                  label="AI-статьи в месяц"
                  used={planLimit.articlesUsed}
                  limit={Math.max(planLimit.articlesLimit, 1)}
                />
                <UsageMeter
                  label="AI-посты для соцсетей"
                  used={planLimit.socialPostsUsed}
                  limit={Math.max(planLimit.socialPostsLimit, 1)}
                />
                <UsageMeter
                  label="Полные аудиты"
                  used={planLimit.auditsUsed}
                  limit={Math.max(planLimit.auditsLimit, 1)}
                />
                {planLimit.aiCreditsLimitCents != null ? (
                  <UsageMeter
                    label="AI-токены (EUR)"
                    used={Math.round(planLimit.aiCreditsUsedCents / 100)}
                    limit={Math.max(
                      Math.round(planLimit.aiCreditsLimitCents / 100),
                      1
                    )}
                    unit="€"
                  />
                ) : null}
              </>
            ) : (
              <>
                <UsageMeter label="AI-статьи в месяц" used={0} limit={1} />
                <UsageMeter label="AI-посты для соцсетей" used={0} limit={1} />
                <UsageMeter label="Полные аудиты" used={0} limit={1} />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
