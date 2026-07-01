"use client";

import { useState } from "react";
import Link from "next/link";

import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { GrowthOpportunityCard } from "@/components/dashboard/GrowthOpportunityCard";
import { GoogleSearchConsoleDashboardCard } from "@/components/integrations/GoogleSearchConsoleDashboardCard";
import { GrowthHistoryCard } from "@/components/dashboard/GrowthHistoryCard";
import { GrowthScoreGauge } from "@/components/dashboard/GrowthScoreGauge";
import { IntegrationStatusCard } from "@/components/dashboard/IntegrationStatusCard";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { UsageMeter } from "@/components/dashboard/UsageMeter";
import { useDashboardOverview } from "@/components/dashboard/DashboardOverviewProvider";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";
import {
  formatCheckCategory,
  formatRelativeTime,
  parseRecommendation,
  severityToTaskPriority,
  taskPriorityToCardPriority,
  taskStatusToCardStatus,
} from "@/lib/dashboard/display";
import type { DashboardOverviewCheck } from "@/lib/dashboard/overview";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import {
  BarChart3,
  Globe,
  Loader2,
  RefreshCw,
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

function renderTaskCardsFromChecks(checks: DashboardOverviewCheck[]) {
  return pickTopImprovements(checks).map((check) => (
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
  ));
}

function activityAccent(type: string): "blue" | "cyan" | "violet" | "emerald" | "amber" {
  if (type.includes("AUDIT")) {
    return "blue";
  }
  if (type.includes("GROWTH") || type.includes("SCORE")) {
    return "emerald";
  }
  if (type.includes("OPPORTUNITY")) {
    return "cyan";
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
  const { overview, loading, error, refetch } = useDashboardOverview();
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  async function handleTaskAction(
    taskId: string,
    action: "complete" | "dismiss"
  ) {
    setLoadingTaskId(taskId);
    setTaskActionError(null);

    try {
      const response = await authFetch(`/api/tasks/${taskId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) {
        setTaskActionError(
          await parseApiErrorMessage(
            response,
            action === "complete"
              ? "Не удалось отметить задачу выполненной"
              : "Не удалось скрыть задачу"
          )
        );
        return;
      }

      await refetch({ silent: true });
    } catch {
      setTaskActionError("Сетевая ошибка при обновлении задачи");
    } finally {
      setLoadingTaskId(null);
    }
  }

  async function handleRerunAudit() {
    if (!overview?.website || isRunningAudit) {
      return;
    }

    setIsRunningAudit(true);
    setAuditError(null);

    try {
      const response = await authFetch(
        `/api/websites/${overview.website.id}/audits/run`,
        { method: "POST" }
      );

      if (!response.ok) {
        let message = "Не удалось запустить проверку";

        try {
          const body = (await response.json()) as {
            error?: { code?: string; message?: string };
          };
          message = body.error?.message ?? message;
          if (body.error?.code === "PLAN_LIMIT_EXCEEDED") {
            message =
              "Лимит проверок на этот месяц исчерпан. Обновление тарифа появится скоро.";
          }
        } catch {
          message = await parseApiErrorMessage(
            response,
            "Не удалось запустить проверку"
          );
        }

        setAuditError(message);
        return;
      }

      await refetch({ silent: true });
    } catch {
      setAuditError("Сетевая ошибка при проверке сайта");
    } finally {
      setIsRunningAudit(false);
    }
  }

  if (loading) {
    return <PageLoadingState message="Loading your growth overview…" />;
  }

  if (error || !overview) {
    return (
      <PageErrorState
        message={error ?? PAGE_ERROR_FALLBACK}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!overview.website) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          title="Dashboard"
          subtitle="Your website growth overview and latest RankBoost activity."
        />
        <EmptyState
          icon={Globe}
          title="Add a website to start tracking growth opportunities"
          description="Add your website during setup or from the onboarding flow to unlock audits, tasks, and your Control Center."
          action={
            <Link
              href="/app/onboarding"
              className="inline-flex items-center rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/30"
            >
              Open setup
            </Link>
          }
        />
      </main>
    );
  }

  const growthScore =
    overview.website.currentGrowthScore ??
    overview.latestAudit?.growthScore ??
    0;
  const improvements = pickTopImprovements(overview.checks);
  const dashboardTasks = overview.tasks;
  const usingRealTasks = dashboardTasks.length > 0;
  const taskCards = usingRealTasks
    ? dashboardTasks.map((task) => (
        <TaskCard
          key={task.id}
          title={task.title}
          description={task.description ?? undefined}
          category={formatCheckCategory(task.category)}
          priority={taskPriorityToCardPriority(task.priority)}
          status={taskStatusToCardStatus(task.status)}
          impactScore={task.impactScore ?? undefined}
          showActions
          actionLoading={loadingTaskId === task.id}
          onComplete={() => void handleTaskAction(task.id, "complete")}
          onDismiss={() => void handleTaskAction(task.id, "dismiss")}
        />
      ))
    : renderTaskCardsFromChecks(overview.checks);
  const taskCount = usingRealTasks ? dashboardTasks.length : improvements.length;
  const planLimit = overview.planLimit;
  const scoreDelta = overview.growthScoreDelta;
  const gsc = overview.googleSearchConsole;
  const gscClicks = gsc.metricsSummary?.clicks;
  const growthOpportunities = overview.growthOpportunities;
  const growthOpportunityCount = overview.growthOpportunityCount;
  const scoreTrend =
    scoreDelta != null && scoreDelta !== 0
      ? {
          value: `${scoreDelta > 0 ? "↑" : "↓"} ${Math.abs(scoreDelta)} за последний аудит`,
          positive: scoreDelta > 0,
        }
      : undefined;

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        title="Dashboard"
        subtitle={
          growthOpportunityCount > 0
            ? `RankBoost found ${growthOpportunityCount} new growth opportunit${growthOpportunityCount === 1 ? "y" : "ies"} since your last visit.`
            : "Your website growth overview and latest RankBoost activity."
        }
        actions={
          <button
            type="button"
            onClick={() => void handleRerunAudit()}
            disabled={isRunningAudit}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunningAudit ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running audit…
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Run audit
              </>
            )}
          </button>
        }
      />
      <p className="-mt-4 mb-8 text-xs text-slate-500">
        {overview.website.url}
        {overview.website.lastAuditAt
          ? ` · Last audit ${formatRelativeTime(overview.website.lastAuditAt)}`
          : ""}
      </p>

      {auditError ? (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {auditError}
        </div>
      ) : null}

      {taskActionError ? (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {taskActionError}
        </div>
      ) : null}

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
          value={
            gscClicks != null ? gscClicks.toLocaleString("ru-RU") : "—"
          }
          subtitle={
            gscClicks != null
              ? "Клики из Google Search Console за 28 дней"
              : "Подключите Google Search Console для реальных кликов"
          }
          icon={Zap}
          accent="cyan"
        />
      </section>

      <section className="mb-8">
        <GoogleSearchConsoleDashboardCard data={gsc} />
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Новые возможности</h3>
          <span className="text-xs text-slate-500">
            {growthOpportunityCount}{" "}
            {growthOpportunityCount === 1
              ? "возможность"
              : growthOpportunityCount >= 2 && growthOpportunityCount <= 4
                ? "возможности"
                : "возможностей"}
          </span>
        </div>
        {growthOpportunities.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {growthOpportunities.map((opportunity) => (
              <GrowthOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onRunAudit={() => void handleRerunAudit()}
                auditLoading={isRunningAudit}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="Сейчас всё выглядит отлично"
            description="RankBoost продолжит искать новые возможности после аудита, синхронизации GSC и выполнения задач."
          />
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Главные улучшения</h3>
            <span className="text-xs text-slate-500">
              {taskCount} {usingRealTasks ? "задач" : "рекомендаций"}
            </span>
          </div>
          {taskCards.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
              {taskCards}
            </div>
          ) : (
            <EmptyState
              icon={Globe}
              title="Пока нет активных задач"
              description="Запустите аудит, чтобы получить рекомендации."
            />
          )}
        </section>

        <section className="space-y-8">
          <GrowthHistoryCard history={overview.growthHistory} />

          <div>
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
              status={gsc.connected ? "connected" : "disconnected"}
              lastSync={
                gsc.lastFetchedAt
                  ? formatRelativeTime(gsc.lastFetchedAt)
                  : undefined
              }
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
