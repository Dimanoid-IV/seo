"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Globe } from "lucide-react";

import { GenerateArticleForm } from "@/components/content-plan/GenerateArticleForm";

import { ContentIdeaCard } from "@/components/dashboard/ContentIdeaCard";
import { ContentPlanSection } from "@/components/dashboard/ContentPlanSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { TrustNote } from "@/components/shared/TrustNote";
import { PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { authFetch } from "@/lib/auth/client-session";
import {
  formatCheckCategory,
  taskPriorityToCardPriority,
  taskStatusToCardStatus,
} from "@/lib/dashboard/display";
import type { ContentPlanOverviewData } from "@/lib/content-plan/types";
import { formatContentPlanMonth } from "@/lib/content-plan/format";
import { Button } from "@/components/ui/button";

const ARTICLE_STATUS_LABELS: Record<string, string> = {
  IDEA: "Идея",
  DRAFT: "Черновик",
  WAITING_REVIEW: "На проверке",
  APPROVED: "Одобрено",
  WORDPRESS_DRAFT_CREATED: "В WordPress",
};

const SOCIAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  READY: "Готов",
  COPIED: "Скопирован",
  SCHEDULED: "Запланирован",
};

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  X: "X",
  TIKTOK: "TikTok",
};

async function fetchContentPlan(): Promise<{
  data: ContentPlanOverviewData | null;
  error: string | null;
}> {
  try {
    const response = await authFetch("/api/content-plan/overview");

    if (!response.ok) {
      return { data: null, error: "Не удалось загрузить план контента" };
    }

    const body = (await response.json()) as { data: ContentPlanOverviewData };
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: "Сетевая ошибка при загрузке плана" };
  }
}

export function ContentPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<ContentPlanOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialPlan() {
      const result = await fetchContentPlan();
      if (cancelled) {
        return;
      }
      setPlan(result.data);
      setError(result.error);
      setLoading(false);
    }

    void loadInitialPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <PageLoadingState message="Loading content plan…" />;
  }

  if (error || !plan) {
    return (
      <PageErrorState
        message={error ?? PAGE_ERROR_FALLBACK}
        onRetry={() => void reloadPlan()}
      />
    );
  }

  if (!plan.website) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          title="Content Plan"
          subtitle="Plan and review content ideas based on real growth opportunities."
        />
        <EmptyState
          icon={Globe}
          title="Add a website to start tracking growth opportunities"
          description="Add your website to see content ideas, article drafts, and social opportunities in one place."
        />
      </main>
    );
  }

  const monthLabel = formatContentPlanMonth(plan.month);

  async function reloadPlan() {
    const result = await fetchContentPlan();
    setPlan(result.data);
    setError(result.error);
  }

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        title="Content Plan"
        subtitle="Plan and review content ideas based on real growth opportunities."
        actions={
          <Button type="button" onClick={() => setShowGenerateForm(true)}>
            Generate article
          </Button>
        }
      />
      <p className="-mt-4 mb-4 text-xs text-slate-500">
        {monthLabel} · {plan.website.url}
      </p>
      <TrustNote variant="ai" className="mb-8" />
      {plan.monthlyPlan?.summary ? (
        <p className="mb-8 max-w-2xl text-sm text-slate-300">
          {plan.monthlyPlan.summary}
        </p>
      ) : null}

      {!plan.monthlyPlan ? (
        <EmptyState
          icon={CalendarDays}
          title="No monthly plan yet"
          description="Generate a monthly plan from Autopilot or complete your first audit to unlock content priorities."
          className="mb-8"
        />
      ) : null}

      <div className="space-y-10">
        <ContentPlanSection
          title="Главные задачи"
          description="Активные задачи из аудита — без AI, только приоритеты"
          count={plan.tasks.length}
        >
          {plan.tasks.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {plan.tasks.map((task) => (
                <div key={task.id} className="space-y-3">
                  <TaskCard
                    title={task.title}
                    description={task.description ?? undefined}
                    category={formatCheckCategory(task.category)}
                    priority={taskPriorityToCardPriority(task.priority)}
                    status={taskStatusToCardStatus(task.status)}
                    impactScore={task.impactScore ?? undefined}
                    footerAction={
                      task.category === "CONTENT" ? (
                        expandedTaskId === task.id ? (
                          <GenerateArticleForm
                            websiteId={plan.website!.id}
                            taskId={task.id}
                            defaultTopic={task.title}
                            submitLabel="Создать статью по задаче"
                            onSuccess={(articleId) => {
                              void reloadPlan();
                              router.push(`/app/articles/${articleId}`);
                            }}
                          />
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedTaskId(task.id)}
                            className="border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
                          >
                            Создать статью по задаче
                          </Button>
                        )
                      ) : undefined
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Нет активных задач"
              description="Запустите аудит или откройте задачи на главном dashboard."
            />
          )}
        </ContentPlanSection>

        <ContentPlanSection
          title="Идеи статей"
          description="Черновики и идеи для контентного роста"
          count={plan.articles.length}
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowGenerateForm((current) => !current)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
            >
              Создать статью
            </Button>
          </div>

          {showGenerateForm ? (
            <GenerateArticleForm
              websiteId={plan.website.id}
              defaultLanguage="RU"
              submitLabel="Generate"
              className="mb-6"
              onSuccess={(articleId) => {
                void reloadPlan();
                router.push(`/app/articles/${articleId}`);
              }}
            />
          ) : null}

          {plan.articles.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {plan.articles.map((article) => (
                <ContentIdeaCard
                  key={article.id}
                  kind="article"
                  href={`/app/articles/${article.id}`}
                  title={article.title}
                  subtitle={
                    article.targetKeyword
                      ? `Ключ: ${article.targetKeyword}`
                      : undefined
                  }
                  description={article.topic ?? undefined}
                  badge={ARTICLE_STATUS_LABELS[article.status] ?? article.status}
                  meta={article.language}
                  qualityIndicator={
                    article.generatedByAIJobId
                      ? article.qualityPassed === true
                        ? "passed"
                        : "needs_review"
                      : null
                  }
                  action={
                    <Link
                      href={`/app/articles/${article.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className:
                          "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10",
                      })}
                    >
                      Открыть статью
                    </Link>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Пока нет идей статей"
              description="Идеи статей появятся после подключения AI-плана."
            />
          )}
        </ContentPlanSection>

        <ContentPlanSection
          title="Посты для соцсетей"
          description="Заготовки для Facebook, LinkedIn и других каналов"
          count={plan.socialPosts.length}
        >
          {plan.socialPosts.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {plan.socialPosts.map((post) => (
                <ContentIdeaCard
                  key={post.id}
                  kind="social"
                  title={post.hook ?? post.text.slice(0, 80)}
                  description={post.text}
                  badge={
                    SOCIAL_STATUS_LABELS[post.status] ?? post.status
                  }
                  meta={PLATFORM_LABELS[post.platform] ?? post.platform}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Пока нет постов"
              description="Посты для соцсетей появятся после генерации контента."
            />
          )}
        </ContentPlanSection>
      </div>
    </main>
  );
}
