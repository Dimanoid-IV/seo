"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe, ListTodo } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { authFetch } from "@/lib/auth/client-session";
import { PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";
import {
  formatCheckCategory,
  taskPriorityToCardPriority,
  taskStatusToCardStatus,
} from "@/lib/dashboard/display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { TasksOverviewData } from "@/lib/tasks/types";

function formatCreatedDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TasksPage() {
  const { dict, locale } = useSaasTranslations();
  const t = dict.tasksPage;
  const [overview, setOverview] = useState<TasksOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  function sourceLabel(source: string): string {
    const key = source.toLowerCase() as keyof typeof t.sources;
    return t.sources[key] ?? source;
  }

  if (loading) {
    return <PageLoadingState message={t.loading} />;
  }

  if (error || !overview) {
    return (
      <PageErrorState
        message={error ?? PAGE_ERROR_FALLBACK}
        onRetry={() => void reloadTasks()}
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
          {groupedTasks.map((group) => (
            <section key={group.key}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  {t.sections[group.key]}
                </h2>
                <span className="text-xs text-slate-500">{group.tasks.length}</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {group.tasks.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <TaskCard
                      title={task.title}
                      description={task.description ?? undefined}
                      category={formatCheckCategory(task.category)}
                      priority={taskPriorityToCardPriority(task.priority)}
                      status={taskStatusToCardStatus(task.status)}
                      impactScore={task.impactScore ?? undefined}
                    />
                    <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-slate-500">
                      <span>
                        {t.sourceLabel}: {sourceLabel(task.source)}
                      </span>
                      <span>
                        {t.createdLabel}: {formatCreatedDate(task.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
