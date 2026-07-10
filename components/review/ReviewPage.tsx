"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Globe, Pencil, X } from "lucide-react";

import { useDashboardMode } from "@/components/dashboard/DashboardModeProvider";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type {
  ReviewItemGroup,
  ReviewItemType,
  ReviewQueueData,
  ReviewQueueItem,
} from "@/lib/review-queue/types";
import { cn } from "@/lib/utils";

type TabKey = ReviewItemGroup;

const statusStyles = {
  AWAITING_REVIEW: "border-violet-200 bg-violet-50 text-violet-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
  READY_TO_PUBLISH: "border-blue-200 bg-blue-50 text-blue-800",
} as const;

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReviewPage() {
  const { dict, locale } = useSaasTranslations();
  const { isAdvanced } = useDashboardMode();
  const t = dict.reviewPage;

  const [data, setData] = useState<ReviewQueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  async function fetchReviewQueue(): Promise<{
    data: ReviewQueueData | null;
    error: string | null;
  }> {
    try {
      const response = await authFetch("/api/review");
      if (!response.ok) {
        return { data: null, error: t.loadFailed };
      }
      const body = (await response.json()) as { data: ReviewQueueData };
      return { data: body.data, error: null };
    } catch {
      return { data: null, error: t.loadFailed };
    }
  }

  async function reload() {
    const result = await fetchReviewQueue();
    setData(result.data);
    setError(result.error);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await fetchReviewQueue();
      if (cancelled) {
        return;
      }
      setData(result.data);
      setError(result.error);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [locale, t.loadFailed]);

  const tabs = useMemo(
    () =>
      [
        { key: "ALL" as const, label: t.tabs.all, count: data?.counts.total ?? 0 },
        { key: "SEO" as const, label: t.tabs.seo, count: data?.counts.seo ?? 0 },
        {
          key: "CONTENT" as const,
          label: t.tabs.content,
          count: data?.counts.content ?? 0,
        },
        {
          key: "SOCIAL" as const,
          label: t.tabs.social,
          count: data?.counts.social ?? 0,
        },
        {
          key: "EMAIL" as const,
          label: t.tabs.email,
          count: data?.counts.email ?? 0,
        },
      ] satisfies Array<{ key: TabKey; label: string; count: number }>,
    [data?.counts, t.tabs]
  );

  const filteredItems =
    !data?.items.length
      ? []
      : activeTab === "ALL"
        ? data.items
        : data.items.filter((item) => item.group === activeTab);

  async function applyAction(
    item: ReviewQueueItem,
    action: "APPROVE" | "REJECT" | "EDIT" | "MARK_DONE",
    content?: string
  ) {
    setActionLoadingId(item.id);
    setActionError(null);

    try {
      const response = await authFetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: item.type,
          sourceId: item.sourceId,
          action,
          content,
        }),
      });

      if (!response.ok) {
        const message = await parseApiErrorMessage(response, t.updateFailed);
        setActionError(message);
        return;
      }

      setEditingId(null);
      setEditContent("");
      await reload();
    } catch {
      setActionError(t.updateFailed);
    } finally {
      setActionLoadingId(null);
    }
  }

  function typeLabel(type: ReviewItemType): string {
    return t.types[type];
  }

  function statusLabel(status: ReviewQueueItem["status"]): string {
    return t.statuses[status];
  }

  function startEdit(item: ReviewQueueItem) {
    setEditingId(item.id);
    setEditContent(item.preview);
    setActionError(null);
  }

  if (loading) {
    return <PageLoadingState message={t.loading} />;
  }

  if (error || !data) {
    return (
      <PageErrorState
        message={error ?? t.loadFailed}
        onRetry={() => void reload()}
        retryLabel={dict.common.tryAgain}
      />
    );
  }

  if (!data.website) {
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
      <p className="-mt-4 mb-6 text-xs text-slate-500">{data.website.url}</p>

      <p className="mb-6 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm text-slate-700">
        {t.safetyNote}
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              activeTab === tab.key
                ? "border-violet-300 bg-violet-100 text-violet-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {tab.label}
            {tab.count > 0 ? (
              <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
            ) : null}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={t.emptyTitle}
          description={t.emptyDescription}
          action={
            <Button
              render={<Link href="/app/tasks" />}
              nativeButton={false}
              variant="outline"
              className="border-slate-200"
            >
              {t.openTasks}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id;
            const isLoading = actionLoadingId === item.id;

            return (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {typeLabel(item.type)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-medium",
                          statusStyles[item.status]
                        )}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {item.title}
                    </h2>
                    {item.sourceTaskTitle ? (
                      <p className="text-xs text-slate-500">
                        {t.fromTask}: {item.sourceTaskTitle}
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-400">
                      {t.updatedLabel}: {formatDate(item.updatedAt, locale)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {isEditing ? (
                    <Textarea
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      rows={5}
                      className="border-slate-200 bg-slate-50 text-sm"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                      {item.preview}
                    </p>
                  )}
                </div>

                {isAdvanced && item.editHref ? (
                  <p className="mt-2 text-xs text-slate-500">
                    {t.advancedEditHint}{" "}
                    <Link href={item.editHref} className="text-blue-600 hover:text-blue-700">
                      {t.openFullEditor}
                    </Link>
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        disabled={isLoading || !editContent.trim()}
                        onClick={() =>
                          void applyAction(item, "EDIT", editContent.trim())
                        }
                        className="bg-violet-600 text-white hover:bg-violet-500"
                      >
                        {t.saveEdit}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => {
                          setEditingId(null);
                          setEditContent("");
                        }}
                        className="border-slate-200"
                      >
                        {dict.common.close}
                      </Button>
                    </>
                  ) : (
                    <>
                      {item.canApprove ? (
                        <Button
                          type="button"
                          disabled={isLoading}
                          onClick={() => void applyAction(item, "APPROVE")}
                          className="bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          {t.approve}
                        </Button>
                      ) : null}
                      {item.canEdit ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => startEdit(item)}
                          className="border-slate-200"
                        >
                          <Pencil className="size-4" />
                          {t.edit}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => void applyAction(item, "REJECT")}
                        className="border-slate-200 text-slate-700"
                      >
                        <X className="size-4" />
                        {t.reject}
                      </Button>
                      {item.sourceTaskId &&
                      (item.type === "META_FIX" ||
                        item.type === "SEO_FIX" ||
                        item.type === "TASK_FIX") ? (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isLoading}
                          onClick={() => void applyAction(item, "MARK_DONE")}
                          className="text-slate-500"
                        >
                          {t.markDone}
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {actionError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}
    </main>
  );
}
