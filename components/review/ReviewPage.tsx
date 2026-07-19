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
import { trackClientEvent } from "@/lib/analytics/client";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type {
  ReviewActionNeeded,
  ReviewItemGroup,
  ReviewItemType,
  ReviewQueueData,
  ReviewQueueItem,
} from "@/lib/review-queue/types";
import { cn } from "@/lib/utils";

type TabKey = ReviewItemGroup | ReviewActionNeeded | "ACTION_ALL";

const statusStyles = {
  AWAITING_REVIEW: "border-violet-200 bg-violet-50 text-violet-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
  READY_TO_PUBLISH: "border-blue-200 bg-blue-50 text-blue-800",
} as const;

const ACTION_TABS: Array<{ key: TabKey; labelKey: string }> = [
  { key: "ACTION_ALL", labelKey: "all" },
  { key: "READY_TO_APPROVE", labelKey: "readyToApprove" },
  { key: "READY_TO_PUBLISH_HANDOFF", labelKey: "readyToPublishHandoff" },
  { key: "QUALITY_NEEDS_REPAIR", labelKey: "qualityNeedsRepair" },
  { key: "WORDPRESS_DRAFT_CREATED", labelKey: "wordpressDraftCreated" },
  { key: "CUSTOM_PACKAGE_READY", labelKey: "customPackageReady" },
];

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pipelineLabelForState(
  state: string | undefined,
  labels: {
    researchReady: string;
    draftGenerating: string;
    draftReadyForReview: string;
    qualityNeedsRepair: string;
    universalPackageReady: string;
    wordpressDraftCreated: string;
    webhookReady: string;
    readyForPublishingHandoff: string;
  }
): string | null {
  switch (state) {
    case "RESEARCH_READY":
      return labels.researchReady;
    case "DRAFT_GENERATING":
      return labels.draftGenerating;
    case "DRAFT_READY_FOR_REVIEW":
      return labels.draftReadyForReview;
    case "QUALITY_FAILED_NEEDS_REPAIR":
      return labels.qualityNeedsRepair;
    case "UNIVERSAL_PACKAGE_READY":
      return labels.universalPackageReady;
    case "WORDPRESS_DRAFT_CREATED":
      return labels.wordpressDraftCreated;
    case "WEBHOOK_READY":
      return labels.webhookReady;
    case "READY_FOR_PUBLISHING_HANDOFF":
      return labels.readyForPublishingHandoff;
    default:
      return null;
  }
}

export function ReviewPage() {
  const { dict, locale } = useSaasTranslations();
  const { isAdvanced } = useDashboardMode();
  const t = dict.reviewPage;

  const [data, setData] = useState<ReviewQueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("ACTION_ALL");
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
    trackClientEvent({
      event: "review_opened",
      route: "/app/review",
    });
  }, []);

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

    const tabs = useMemo(() => {
    const items = data?.items ?? [];
    const labels = t.actionGroups;
    const countFor = (key: TabKey) => {
      if (key === "ACTION_ALL") return items.length;
      return items.filter((item) => item.actionNeeded === key).length;
    };
    return ACTION_TABS.map((tab) => ({
      key: tab.key,
      label: labels[tab.labelKey as keyof typeof labels] ?? tab.labelKey,
      count: countFor(tab.key),
    }));
  }, [data?.items, t.actionGroups]);

  const filteredItems =
    !data?.items.length
      ? []
      : activeTab === "ACTION_ALL"
        ? data.items
        : data.items.filter((item) => item.actionNeeded === activeTab);

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
                      {item.preparedFix ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          {item.preparedFix.generatedBy === "HERMES"
                            ? t.generatedByHermes
                            : t.generatedByTemplate}
                        </span>
                      ) : null}
                      {item.preparedFix?.approvalRequired ? (
                        <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                          {t.approvalRequiredLabel}
                        </span>
                      ) : null}
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

                <div className="mt-4 space-y-3">
                  {item.preparedFix?.summary &&
                  item.preparedFix.summary !== item.preview ? (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {t.summaryLabel}
                      </p>
                      <p className="text-sm text-slate-600">{item.preparedFix.summary}</p>
                    </div>
                  ) : null}

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

                  {item.preparedFix?.whyItMatters ? (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {t.whyItMattersLabel}
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.preparedFix.whyItMatters}
                      </p>
                    </div>
                  ) : null}

                  {item.preparedFix?.implementationNotes ? (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {t.implementationNotesLabel}
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.preparedFix.implementationNotes}
                      </p>
                    </div>
                  ) : null}

                  {item.preparedFix?.riskLevel ? (
                    <p className="text-xs text-slate-500">
                      {t.riskLevelLabel}:{" "}
                      {t.riskLevels[item.preparedFix.riskLevel]}
                    </p>
                  ) : null}

                  {item.type === "ARTICLE_DRAFT" && item.articleContext ? (
                    <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {item.articleContext.qualityScore != null ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                            {t.qualityOutOf(item.articleContext.qualityScore)}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {t.qualityScoreLabel}:{" "}
                            <span className="font-semibold text-slate-800">—</span>
                          </span>
                        )}
                        {item.articleContext.qualityPassed === true ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                            {t.qualityPassedLabel}
                          </span>
                        ) : item.articleContext.qualityPassed === false ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                            {t.qualityFailedLabel}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                            {t.qualityUnknownLabel}
                          </span>
                        )}
                        {item.articleContext.linkedAutopilotPlanItem ? (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 font-medium text-violet-700">
                            {t.autopilotLinkedLabel}
                          </span>
                        ) : null}
                        {item.articleContext.publishPath === "wordpress_draft" ||
                        item.articleContext.wordpressDraftCreated ? (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-medium text-sky-800">
                            WordPress draft
                          </span>
                        ) : item.articleContext.publishPath === "webhook" ? (
                          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 font-medium text-cyan-800">
                            Webhook ready
                          </span>
                        ) : item.articleContext.publishPath === "universal_package" ? (
                          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-800">
                            Universal package
                          </span>
                        ) : null}
                        {item.articleContext.plannedDate ? (
                          <span className="text-slate-500">
                            {formatDate(item.articleContext.plannedDate, locale)}
                          </span>
                        ) : null}
                      </div>
                      {item.articleContext.livePublishBlockedReason &&
                      item.articleContext.planPublishingMode ===
                        "AUTO_PUBLISH" ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                          <p className="text-xs font-semibold text-amber-900">
                            {t.autoPublishGateBlockedTitle}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-800">
                            {t.autoPublishGateBlockedHint}
                          </p>
                          <p className="mt-1 text-[11px] text-amber-700">
                            {item.articleContext.livePublishBlockedReason}
                          </p>
                        </div>
                      ) : null}
                      {item.status === "READY_TO_PUBLISH" ||
                      item.articleContext.qualityPassed === true ? (
                        <p className="text-xs leading-relaxed text-slate-600">
                          {t.articleReadyHint}
                        </p>
                      ) : null}
                      {item.articleContext.autopilotUnlockOnApprove ? (
                        <p className="text-xs text-violet-700">
                          {t.autopilotUnlockHint}
                        </p>
                      ) : null}
                      {item.status === "APPROVED" &&
                      item.articleContext.linkedAutopilotPlanItem ? (
                        <p className="text-xs text-emerald-700">
                          {t.autopilotAlreadyApprovedHint}
                        </p>
                      ) : null}
                      {!item.canApprove &&
                      item.articleContext.qualityPassed === false ? (
                        <p className="text-xs text-amber-700">
                          {t.approveBlockedQuality}
                        </p>
                      ) : null}
                      {item.canApprove && item.editHref ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Link
                            href={item.editHref}
                            className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100"
                          >
                            {t.publishManually}
                          </Link>
                          <Link
                            href={item.editHref}
                            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {t.downloadForSite}
                          </Link>
                        </div>
                      ) : null}
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs font-semibold text-slate-800">
                          {t.whatsNextTitle}
                        </p>
                        <ol className="mt-1.5 list-decimal space-y-0.5 pl-4 text-xs leading-relaxed text-slate-600">
                          {t.whatsNextSteps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                        {item.articleContext.publishPath === "universal_package" ||
                        item.articleContext.publishPath === "webhook" ||
                        (!item.articleContext.wordpressDraftCreated &&
                          item.articleContext.publishPath !== "wordpress_draft") ? (
                          <p className="mt-2 text-xs leading-relaxed text-indigo-800">
                            {t.customPackageHint}
                          </p>
                        ) : null}
                        {pipelineLabelForState(
                          item.articleContext.pipelineState,
                          t.pipelineLabels
                        ) ? (
                          <p className="mt-2 text-xs font-medium text-violet-700">
                            {pipelineLabelForState(
                              item.articleContext.pipelineState,
                              t.pipelineLabels
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
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
                          {item.type === "ARTICLE_DRAFT"
                            ? t.approveArticle
                            : t.approve}
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
