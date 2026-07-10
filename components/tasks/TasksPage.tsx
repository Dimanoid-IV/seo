"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ListTodo } from "lucide-react";

import { useDashboardMode } from "@/components/dashboard/DashboardModeProvider";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";
import {
  formatCheckCategory,
  taskPriorityToCardPriority,
  taskStatusToCardStatus,
} from "@/lib/dashboard/display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { resolveTaskExecutionCapability } from "@/lib/tasks/execution-capability";
import type { SerializedTask } from "@/lib/tasks/task-actions";
import type { TaskListItem, TasksOverviewData } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

function formatCreatedDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isActiveTask(status: string): boolean {
  const normalized = status.toLowerCase();
  return normalized === "open" || normalized === "in_progress";
}

function mapSerializedTaskToListItem(task: SerializedTask): TaskListItem {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: task.status,
    source: task.source,
    impactScore: task.impactScore,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
    whyItMatters: task.whyItMatters,
    recommendedAction: task.recommendedAction,
    estimatedFixMinutes: task.estimatedFixMinutes,
    auditCheckCode: task.auditCheckCode,
  };
}

export function TasksPage() {
  const router = useRouter();
  const { dict, locale } = useSaasTranslations();
  const { isAdvanced } = useDashboardMode();
  const t = dict.tasksPage;
  const [overview, setOverview] = useState<TasksOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function fetchTasks(): Promise<{
    data: TasksOverviewData | null;
    error: string | null;
  }> {
    try {
      const response = await authFetch("/api/tasks");

      if (!response.ok) {
        return { data: null, error: t.loadFailed };
      }

      const body = (await response.json()) as { data: TasksOverviewData };
      return { data: body.data, error: null };
    } catch {
      return { data: null, error: t.loadNetworkError };
    }
  }

  async function reloadTasks() {
    const result = await fetchTasks();
    setOverview(result.data);
    setError(result.error);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialTasks() {
      const result = await fetchTasks();
      if (cancelled) {
        return;
      }
      setOverview(result.data);
      setError(result.error);
      setLoading(false);
    }

    void loadInitialTasks();

    return () => {
      cancelled = true;
    };
  }, [locale, t.loadFailed, t.loadNetworkError]);

  const selectedTask = useMemo(
    () => overview?.tasks.find((task) => task.id === selectedTaskId) ?? null,
    [overview?.tasks, selectedTaskId]
  );

  const selectedCapability = useMemo(() => {
    if (!selectedTask || !overview) {
      return null;
    }
    return resolveTaskExecutionCapability(
      selectedTask,
      overview.integrations
    );
  }, [overview, selectedTask]);

  const integrations = overview?.integrations ?? {
    gscConnected: false,
    gscPropertySelected: false,
    wordpressConnected: false,
  };

  const groupedTasks = useMemo(() => {
    if (!overview?.tasks.length) {
      return [];
    }

    const groups: Array<{
      key: keyof typeof t.sections;
      tasks: TasksOverviewData["tasks"];
    }> = [
      { key: "open", tasks: [] },
      { key: "inProgress", tasks: [] },
      { key: "completed", tasks: [] },
      { key: "dismissed", tasks: [] },
    ];

    for (const task of overview.tasks) {
      const normalized = task.status.toLowerCase();
      if (normalized === "in_progress") {
        groups[1]?.tasks.push(task);
      } else if (normalized === "completed") {
        groups[2]?.tasks.push(task);
      } else if (normalized === "dismissed") {
        groups[3]?.tasks.push(task);
      } else {
        groups[0]?.tasks.push(task);
      }
    }

    return groups.filter((group) => group.tasks.length > 0);
  }, [overview?.tasks, t.sections]);

  const hasActiveTasks = useMemo(
    () => overview?.tasks.some((task) => isActiveTask(task.status)) ?? false,
    [overview?.tasks]
  );

  function sourceLabel(source: string): string {
    const key = source.toLowerCase() as keyof typeof t.sources;
    return t.sources[key] ?? source;
  }

  function openTaskDetails(task: TaskListItem) {
    setSelectedTaskId(task.id);
    setActionError(null);
    setSheetOpen(true);
  }

  async function updateTaskStatus(
    taskId: string,
    status: "COMPLETED" | "IN_PROGRESS" | "DISMISSED"
  ) {
    setActionLoading(true);
    setActionError(null);

    try {
      const response = await authFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const message = await parseApiErrorMessage(response, t.updateFailed);
        setActionError(message);
        return;
      }

      const body = (await response.json()) as { data: SerializedTask };
      const updatedTask = mapSerializedTaskToListItem(body.data);

      setOverview((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          ),
        };
      });

      if (status === "COMPLETED" || status === "DISMISSED") {
        setSheetOpen(false);
      }
    } catch {
      setActionError(t.updateFailed);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <PageLoadingState message={t.loading} />;
  }

  if (error || !overview) {
    return (
      <PageErrorState
        message={error ?? PAGE_ERROR_FALLBACK}
        onRetry={() => void reloadTasks()}
        retryLabel={dict.common.tryAgain}
      />
    );
  }

  if (!overview.website) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <EmptyState
          icon={Globe}
          title={dict.dashboard.addWebsiteTitle}
          description={dict.dashboard.addWebsiteDescription}
        />
      </main>
    );
  }

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <p className="-mt-4 mb-8 text-xs text-slate-500">{overview.website.url}</p>

      {overview.tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={t.emptyTitle}
          description={t.emptyDescription}
        />
      ) : (
        <div className="space-y-10">
          {!hasActiveTasks ? (
            <EmptyState
              icon={ListTodo}
              title={t.emptyOpenTitle}
              description={t.emptyOpenDescription}
              className="mb-2"
            />
          ) : null}

          {groupedTasks.map((group) => (
            <section key={group.key}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  {t.sections[group.key]}
                </h2>
                <span className="text-xs text-slate-500">{group.tasks.length}</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {group.tasks.map((task) => {
                  const active = isActiveTask(task.status);
                  const capability = resolveTaskExecutionCapability(
                    task,
                    integrations
                  );
                  const execution = t.execution;

                  return (
                    <div key={task.id} className="space-y-2">
                      {active ? (
                        <div className="flex flex-wrap items-center gap-2 px-1">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              capability.mode === "REVIEW"
                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            )}
                          >
                            {execution.modes[capability.mode]}
                          </span>
                          <span className="text-xs text-slate-500">
                            {isAdvanced
                              ? execution.requirements[
                                  capability.integrationRequired === "WORDPRESS"
                                    ? "wordpress"
                                    : capability.integrationRequired === "GSC"
                                      ? "gsc"
                                      : capability.canRankBoostHelp
                                        ? "reviewApproval"
                                        : "manual"
                                ]
                              : execution.simpleHints[capability.simpleHintKey]}
                          </span>
                        </div>
                      ) : null}
                      <TaskCard
                        title={task.title}
                        description={task.description ?? undefined}
                        category={formatCheckCategory(task.category)}
                        priority={taskPriorityToCardPriority(task.priority)}
                        status={taskStatusToCardStatus(task.status)}
                        impactScore={task.impactScore ?? undefined}
                        footerAction={
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-slate-200 bg-white text-slate-700"
                            onClick={() => openTaskDetails(task)}
                          >
                            {active ? t.openTask : t.details}
                          </Button>
                        }
                      />
                      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-slate-500">
                        <span>
                          {t.sourceLabel}: {sourceLabel(task.source)}
                        </span>
                        <span>
                          {t.createdLabel}:{" "}
                          {formatCreatedDate(task.createdAt, locale)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <TaskDetailSheet
        task={selectedTask}
        capability={selectedCapability}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        websiteId={overview.website.id}
        websiteUrl={overview.website.url}
        actionLoading={actionLoading}
        actionError={actionError}
        onMarkDone={
          selectedTask && isActiveTask(selectedTask.status)
            ? () => void updateTaskStatus(selectedTask.id, "COMPLETED")
            : undefined
        }
        onMarkInProgress={
          selectedTask?.status.toLowerCase() === "open"
            ? () => void updateTaskStatus(selectedTask.id, "IN_PROGRESS")
            : undefined
        }
        onSkip={
          selectedTask && isActiveTask(selectedTask.status)
            ? () => void updateTaskStatus(selectedTask.id, "DISMISSED")
            : undefined
        }
        onDraftCreated={(articleId) => {
          void reloadTasks();
          router.push(`/app/articles/${articleId}`);
        }}
      />
    </main>
  );
}
