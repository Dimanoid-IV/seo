"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Globe } from "lucide-react";

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
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { translateContentStatus } from "@/lib/i18n/saas/statuses";

const CONTENT_PLAN_LOAD_TIMEOUT_MS = 12_000;

export function ContentPlanPage() {
  const router = useRouter();
  const { dict, locale } = useSaasTranslations();
  const cp = dict.contentPlan;
  const [plan, setPlan] = useState<ContentPlanOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadRequestRef = useRef(0);

  async function refreshPlan() {
    try {
      const response = await authFetch("/api/content-plan/overview");
      if (!response.ok) {
        return;
      }
      const body = (await response.json()) as { data: ContentPlanOverviewData };
      setPlan(body.data);
      setError(null);
    } catch {
      // Keep the current plan visible if a background refresh fails.
    }
  }

  function requestReload() {
    loadRequestRef.current += 1;
    setReloadKey((current) => current + 1);
  }

  useEffect(() => {
    let cancelled = false;
    const requestId = ++loadRequestRef.current;
    let timeoutId: number | null = null;

    async function loadInitialPlan() {
      setLoading(true);
      setLoadTimedOut(false);
      setError(null);

      timeoutId = window.setTimeout(() => {
        if (!cancelled && requestId === loadRequestRef.current) {
          setLoadTimedOut(true);
        }
      }, CONTENT_PLAN_LOAD_TIMEOUT_MS);

      let result: {
        data: ContentPlanOverviewData | null;
        error: string | null;
      };

      try {
        const response = await authFetch("/api/content-plan/overview");

        if (!response.ok) {
          result = { data: null, error: cp.loadFailed };
        } else {
          const body = (await response.json()) as {
            data: ContentPlanOverviewData;
          };
          result = { data: body.data, error: null };
        }
      } catch {
        result = { data: null, error: cp.loadNetworkError };
      }

      if (cancelled || requestId !== loadRequestRef.current) {
        return;
      }

      setPlan(result.data);
      setError(result.error);
      setLoading(false);
      setLoadTimedOut(false);
    }

    void loadInitialPlan();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [locale, cp.loadFailed, cp.loadNetworkError, reloadKey]);

  if (loading && loadTimedOut) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader title={cp.title} subtitle={cp.subtitle} />
        <EmptyState
          icon={Clock}
          title={cp.loadTimeoutTitle}
          description={cp.loadTimeoutDescription}
          action={
            <Button type="button" onClick={requestReload}>
              {cp.retry}
            </Button>
          }
        />
      </main>
    );
  }

  if (loading) {
    return <PageLoadingState message={cp.loading} />;
  }

  if (error || !plan) {
    return (
      <PageErrorState
        message={error ?? PAGE_ERROR_FALLBACK}
        onRetry={requestReload}
        retryLabel={cp.retry}
      />
    );
  }

  if (!plan.website) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader title={cp.title} subtitle={cp.subtitle} />
        <EmptyState
          icon={Globe}
          title={dict.dashboard.addWebsiteTitle}
          description={dict.dashboard.addWebsiteDescription}
        />
      </main>
    );
  }

  const monthLabel = formatContentPlanMonth(plan.month);

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        title={cp.title}
        subtitle={cp.subtitle}
        actions={
          <Button type="button" onClick={() => setShowGenerateForm(true)}>
            {cp.generateArticle}
          </Button>
        }
      />
      <p className="-mt-4 mb-4 text-xs text-slate-500">
        {monthLabel} · {plan.website.url}
      </p>
      <TrustNote variant="ai" className="mb-8" />
      {plan.monthlyPlan?.summary ? (
        <p className="mb-8 max-w-2xl text-sm text-slate-600">
          {plan.monthlyPlan.summary}
        </p>
      ) : null}

      {!plan.monthlyPlan ? (
        <EmptyState
          icon={CalendarDays}
          title={cp.noMonthlyPlanTitle}
          description={cp.noMonthlyPlanDescription}
          className="mb-8"
        />
      ) : null}

      <div className="space-y-10">
        <ContentPlanSection
          title={cp.topTasks}
          description={cp.topTasksDescription}
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
                            submitLabel={cp.createArticle}
                            onSuccess={(articleId) => {
                              void refreshPlan();
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
                            {cp.createArticle}
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
              title={cp.noTasksTitle}
              description={cp.noTasksDescription}
            />
          )}
        </ContentPlanSection>

        <ContentPlanSection
          title={cp.articleIdeas}
          description={cp.articleIdeasDescription}
          count={plan.articles.length}
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowGenerateForm((current) => !current)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
            >
              {cp.generateArticle}
            </Button>
          </div>

          {showGenerateForm ? (
            <GenerateArticleForm
              websiteId={plan.website.id}
              defaultLanguage="RU"
              submitLabel={cp.generateLabel}
              className="mb-6"
              onSuccess={(articleId) => {
                void refreshPlan();
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
                      ? `${cp.keywordPrefix} ${article.targetKeyword}`
                      : undefined
                  }
                  description={article.topic ?? undefined}
                  badge={translateContentStatus(locale, article.status)}
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
                          "border-slate-300 bg-white/5 text-slate-700 hover:bg-slate-100",
                      })}
                    >
                      {cp.openArticle}
                    </Link>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={cp.noIdeasTitle}
              description={cp.noIdeasDescription}
            />
          )}
        </ContentPlanSection>

        <ContentPlanSection
          title={cp.socialPostsTitle}
          description={cp.socialPostsDescription}
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
                  badge={translateContentStatus(locale, post.status)}
                  meta={
                    cp.platforms[post.platform as keyof typeof cp.platforms] ??
                    post.platform
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={cp.noSocialPostsTitle}
              description={cp.noSocialPostsDescription}
            />
          )}
        </ContentPlanSection>
      </div>
    </main>
  );
}
