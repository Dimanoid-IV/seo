"use client";

import Link from "next/link";
import { Check, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ResearchBriefPreview } from "@/components/content-research/ResearchBriefPreview";
import { researchSummaryFromBrief } from "@/components/content-research/ResearchBriefPreview";
import { TopicBriefDrawer } from "@/components/autopilot/TopicBriefDrawer";
import { trackClientEvent } from "@/lib/analytics/client";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type {
  AutopilotPlanItem,
  AutopilotPlanItemsDocument,
  AutopilotPlanPeriod,
} from "@/lib/autopilot/plan-item-types";
import { isPlanItemDueNow } from "@/lib/autopilot/execution-eligibility";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { localizePlanItemTitle } from "@/lib/i18n/saas/plan-display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type PlanApprovalPanelProps = {
  planId: string;
  planItems: AutopilotPlanItemsDocument;
  onApproved?: () => void;
};

function formatActionDate(iso: string | undefined, locale: SaasLocale): string {
  if (!iso) return "—";
  const intlLocale = locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function getArticleApprovalStateLabel(
  item: AutopilotPlanItem,
  t: ReturnType<typeof useSaasTranslations>["dict"]["autopilot"]["planApproval"]
): string | null {
  if (item.type !== "ARTICLE" || !item.generatedArticleId) {
    return null;
  }

  if (item.articleQualityPassed === false) {
    return t.articleApprovalState.qualityFailed;
  }

  if (item.status === "executed" || item.status === "published") {
    return t.articleApprovalState.wordpressDraft;
  }

  if (item.linkedArticleApprovedAt) {
    return t.articleApprovalState.readyForRun;
  }

  if (item.articleQualityPassed) {
    return t.articleApprovalState.waitingReview;
  }

  return null;
}

function getSchedulerHint(
  item: AutopilotPlanItem,
  t: ReturnType<typeof useSaasTranslations>["dict"]["autopilot"]["planApproval"]
): string | null {
  if (!["approved", "scheduled", "prepared"].includes(item.status)) {
    return null;
  }

  if (item.blockedReasonKey === "wordpressNotConnected") {
    return t.schedulerWordPressRequired;
  }

  if (item.type === "ARTICLE") {
    if (!item.generatedArticleId) {
      return t.schedulerWillPrepareDraft;
    }
    if (item.articleQualityPassed === false) {
      return t.schedulerQualityFailed;
    }
    if (item.status === "executed" || item.status === "published") {
      return t.schedulerWordPressDraftCreated;
    }
    if (item.linkedArticleApprovedAt) {
      return t.schedulerReadyForNextRun;
    }
    if (item.status === "prepared" && item.articleQualityPassed) {
      return t.schedulerWaitingReview;
    }
  }

  return null;
}

function isSelectable(item: AutopilotPlanItem): boolean {
  return ["proposed", "approved", "scheduled", "blocked"].includes(item.status);
}

export function PlanApprovalPanel({
  planId,
  planItems,
  onApproved,
}: PlanApprovalPanelProps) {
  const { dict, locale } = useSaasTranslations();
  const t = dict.autopilot.planApproval;
  const [period, setPeriod] = useState<AutopilotPlanPeriod>(planItems.period);
  const [publishingMode, setPublishingMode] = useState<
    "REVIEW_ONLY" | "AUTO_PUBLISH"
  >("REVIEW_ONLY");
  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of planItems.items) {
      if (isSelectable(item) && item.selected !== false) {
        initial.add(item.id);
      }
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [generatingItemId, setGeneratingItemId] = useState<string | null>(null);
  const [refreshingItemId, setRefreshingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [itemOverrides, setItemOverrides] = useState<
    Record<string, Partial<AutopilotPlanItem>>
  >({});
  const [detailsItemId, setDetailsItemId] = useState<string | null>(null);

  const displayItems = useMemo(
    () =>
      planItems.items.map((item) => ({
        ...item,
        ...(itemOverrides[item.id] ?? {}),
      })),
    [itemOverrides, planItems.items]
  );

  const selectableItems = useMemo(
    () => displayItems.filter(isSelectable),
    [displayItems]
  );

  const detailsItem = useMemo(
    () => displayItems.find((item) => item.id === detailsItemId) ?? null,
    [detailsItemId, displayItems]
  );

  const detailsBriefReady =
    detailsItem?.researchBrief
      ? researchSummaryFromBrief(detailsItem.researchBrief)?.displayStatus === "ready"
      : false;

  const detailsCanGenerate = Boolean(
    detailsItem &&
      detailsItem.type === "ARTICLE" &&
      detailsItem.researchBrief &&
      !detailsItem.generatedArticleId &&
      ["approved", "scheduled", "prepared", "proposed"].includes(detailsItem.status) &&
      detailsBriefReady
  );

  function handleRemoveFromPlan(item: AutopilotPlanItem) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    setDetailsItemId(null);
    setSuccess(t.briefDrawer.removed);
  }

  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => selected.has(item.id));

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll(select: boolean) {
    if (!select) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(selectableItems.map((item) => item.id)));
  }

  async function handleApprove() {
    if (selected.size === 0) {
      setError(t.selectAtLeastOne);
      return;
    }
    if (!publishingMode) {
      setError(t.publishingModeRequired);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(
        `/api/autopilot/monthly/${planId}/approve-items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemIds: [...selected],
            period,
            publishingMode,
          }),
        }
      );

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.approveFailed));
        return;
      }

      const body = (await response.json()) as {
        data: { approvedCount: number; blockedCount: number };
      };

      if (body.data.blockedCount > 0) {
        setSuccess(t.approvePartialSuccess(body.data.approvedCount, body.data.blockedCount));
      } else {
        setSuccess(t.approveSuccess(body.data.approvedCount));
      }

      onApproved?.();
    } catch {
      setError(t.approveNetworkError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegenerateTopic(item: AutopilotPlanItem) {
    setRefreshingItemId(item.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(
        `/api/autopilot/monthly/${planId}/research-brief`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        }
      );

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.regenerateTopicFailed));
        return;
      }

      const body = (await response.json()) as {
        data: {
          brief?: Record<string, unknown>;
          summary: ReturnType<typeof researchSummaryFromBrief>;
          blockedReasonKey?: string;
          ready?: boolean;
        };
      };

      setItemOverrides((prev) => ({
        ...prev,
        [item.id]: {
          ...(body.data.brief ? { researchBrief: body.data.brief } : {}),
          generatedArticleId: undefined,
          articleQualityScore: undefined,
          articleQualityPassed: undefined,
          linkedArticleApprovedAt: undefined,
          blockedReasonKey: body.data.blockedReasonKey,
          status: body.data.ready ? item.status : "blocked",
        },
      }));

      setSuccess(t.regenerateTopicSuccess);
      onApproved?.();
    } catch {
      setError(t.regenerateTopicNetworkError);
    } finally {
      setRefreshingItemId(null);
    }
  }

  async function handleGenerateDraft(item: AutopilotPlanItem) {
    if (!item.researchBrief) {
      setError(t.researchBriefMissing);
      return;
    }

    setGeneratingItemId(item.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(
        `/api/autopilot/monthly/${planId}/generate-article-draft`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        }
      );

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, t.generateDraftFailed)
        );
        return;
      }

      const body = (await response.json()) as {
        data: {
          article: { id: string; qualityScore: number | null; qualityPassed: boolean | null };
          qualityReport: { score: number; passed: boolean };
          planItem: {
            generatedArticleId: string;
            articleQualityScore: number;
            articleQualityPassed: boolean;
            reviewQueueHref: string;
          };
        };
      };

      setItemOverrides((prev) => ({
        ...prev,
        [item.id]: {
          status: "prepared",
          generatedArticleId: body.data.planItem.generatedArticleId,
          articleQualityScore: body.data.planItem.articleQualityScore,
          articleQualityPassed: body.data.planItem.articleQualityPassed,
          sourceRef: {
            type: "article",
            id: body.data.planItem.generatedArticleId,
          },
          reviewQueueHref: body.data.planItem.reviewQueueHref,
          blockedReasonKey: body.data.qualityReport.passed
            ? undefined
            : "articleNeedsRevision",
        },
      }));

      setSuccess(
        body.data.qualityReport.passed
          ? t.articleGeneratedSuccess
          : t.articleGeneratedNeedsRevision
      );

      onApproved?.();
    } catch {
      setError(t.generateDraftNetworkError);
    } finally {
      setGeneratingItemId(null);
    }
  }

  if (displayItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {t.emptyItems}
      </div>
    );
  }

  const hasApprovedItems = displayItems.some(
    (item) =>
      item.status === "scheduled" ||
      item.status === "approved" ||
      item.status === "prepared" ||
      item.status === "executed"
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t.title}</h3>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
          <p className="mt-2 text-sm text-slate-600">{t.approvalSafetyNote}</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          {(["monthly", "weekly"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium sm:text-sm",
                period === value
                  ? "bg-violet-500 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {t.periods[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => selectAll(!allSelected)}
        >
          {allSelected ? t.clearAll : t.selectAll}
        </Button>
      </div>

      <ul className="space-y-3">
        {displayItems.map((item) => {
          const checked = selected.has(item.id);
          const selectable = isSelectable(item);
          const statusLabel =
            t.itemStatuses[item.status as keyof typeof t.itemStatuses] ??
            item.status;
          const dueNow = isPlanItemDueNow(item);
          const schedulerHint = getSchedulerHint(item, t);
          const articleApprovalState = getArticleApprovalStateLabel(item, t);
          const briefSummary =
            item.type === "ARTICLE" && item.researchBrief
              ? researchSummaryFromBrief(item.researchBrief)
              : null;
          const briefReady = briefSummary?.displayStatus === "ready";

          return (
            <li
              key={item.id}
              className={cn(
                "rounded-xl border bg-white p-4 transition-colors",
                checked ? "border-violet-300 ring-1 ring-violet-200" : "border-slate-200"
              )}
            >
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-slate-300"
                  checked={checked}
                  disabled={!selectable || submitting}
                  onChange={() => toggleItem(item.id)}
                  aria-label={localizePlanItemTitle(item, dict)}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-violet-600">
                        {t.itemTypes[item.type as keyof typeof t.itemTypes] ?? item.type}
                      </p>
                      {item.type === "ARTICLE" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDetailsItemId(item.id);
                            trackClientEvent({
                              event: "article_topic_opened",
                              route: "/app/autopilot",
                              properties: {
                                topicId: item.id,
                                planId,
                                action: "open",
                              },
                            });
                          }}
                          className="text-left font-medium text-slate-900 hover:text-violet-700 hover:underline"
                        >
                          {localizePlanItemTitle(item, dict)}
                        </button>
                      ) : (
                        <h4 className="font-medium text-slate-900">
                          {localizePlanItemTitle(item, dict)}
                        </h4>
                      )}
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase",
                        item.status === "blocked"
                          ? "bg-amber-100 text-amber-800"
                          : item.status === "scheduled" || item.status === "prepared"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {statusLabel}
                    </span>
                    {dueNow ? (
                      <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-violet-800">
                        {t.dueNowBadge}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-slate-600">{item.reason}</p>

                  {item.type === "TASK_FIX" || item.type === "SEO_FIX" ? (
                    <p className="text-xs text-violet-700">
                      {t.itemTypeHints[item.type]}
                    </p>
                  ) : null}

                  {item.type === "ARTICLE" ? (
                    <p className="text-xs text-violet-700">{t.itemTypeHints.ARTICLE}</p>
                  ) : null}

                  {item.type === "ARTICLE" && item.researchBrief ? (
                    <>
                      <ResearchBriefPreview
                        researchBrief={item.researchBrief}
                        planId={planId}
                        planItemId={item.id}
                        compact
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDetailsItemId(item.id);
                          trackClientEvent({
                            event: "article_topic_opened",
                            route: "/app/autopilot",
                            properties: {
                              topicId: item.id,
                              planId,
                              action: "open",
                            },
                          });
                        }}
                        className="text-xs font-medium text-violet-600 hover:text-violet-800 hover:underline"
                      >
                        {t.viewTopicDetails}
                      </button>
                    </>
                  ) : null}

                  {item.type === "ARTICLE" &&
                  item.researchBrief &&
                  ["approved", "scheduled", "prepared", "proposed", "blocked"].includes(
                    item.status
                  ) ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={
                        refreshingItemId !== null ||
                        generatingItemId !== null ||
                        submitting
                      }
                      onClick={() => void handleRegenerateTopic(item)}
                    >
                      {refreshingItemId === item.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      {t.regenerateTopic}
                    </Button>
                  ) : null}

                  {item.type === "ARTICLE" &&
                  item.researchBrief &&
                  !item.generatedArticleId &&
                  ["approved", "scheduled", "prepared", "proposed"].includes(
                    item.status
                  ) ? (
                    <>
                      {!briefReady ? (
                        <p className="text-xs text-amber-800">
                          {t.researchBriefBlocked}
                        </p>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={
                          generatingItemId !== null ||
                          submitting ||
                          item.status === "blocked" ||
                          !briefReady
                        }
                        onClick={() => void handleGenerateDraft(item)}
                      >
                      {generatingItemId === item.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      {t.generateDraftFromResearch}
                    </Button>
                    </>
                  ) : null}

                  {item.generatedArticleId ? (
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-500">
                          {t.qualityScore}:{" "}
                          <span className="font-semibold text-slate-800">
                            {item.articleQualityScore ?? "—"}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-medium",
                            item.articleQualityPassed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {item.articleQualityPassed
                            ? t.qualityPassed
                            : t.qualityNeedsRevision}
                        </span>
                        <Link
                          href={`/app/articles/${item.generatedArticleId}`}
                          className="inline-flex items-center gap-1 font-medium text-violet-600 hover:text-violet-800"
                        >
                          {t.openArticleDraft}
                          <ExternalLink className="size-3" />
                        </Link>
                      </div>
                      {articleApprovalState ? (
                        <p className="text-xs font-medium text-slate-700">
                          {articleApprovalState}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      {t.riskLabel}: {t.riskLevels[item.riskLevel]}
                    </span>
                    <span>
                      {t.integrationLabel}:{" "}
                      {item.needsIntegration ? t.integrationRequired : t.integrationNotRequired}
                    </span>
                    <span>
                      {t.scheduledLabel}:{" "}
                      {formatActionDate(
                        item.scheduledFor ?? item.estimatedActionDate,
                        locale
                      )}
                    </span>
                  </div>

                  {item.blockedReasonKey ? (
                    <p className="text-xs text-amber-700">
                      {dict.autopilot.statusBlock.blockedReasons[
                        item.blockedReasonKey as keyof typeof dict.autopilot.statusBlock.blockedReasons
                      ] ?? item.blockedReasonKey}
                    </p>
                  ) : null}

                  {schedulerHint ? (
                    <p className="text-xs text-violet-700">{schedulerHint}</p>
                  ) : null}

                  {item.reviewQueueHref &&
                  (item.status === "prepared" || item.generatedArticleId) ? (
                    <Link
                      href={item.reviewQueueHref}
                      className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800"
                    >
                      {t.openInReviewQueue}
                      <ExternalLink className="size-3" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}
      {success ? (
        <p className="flex items-center gap-1.5 text-sm text-emerald-700">
          <Check className="size-4" />
          {success}
        </p>
      ) : null}

      {!hasApprovedItems || selectableItems.some((i) => i.status === "proposed") ? (
        <>
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">
              {t.afterApproveTitle}
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
              {t.afterApproveSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs font-medium text-emerald-800">
              {t.afterApproveFooter}
            </p>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">
              {t.publishingModeTitle}
            </legend>
            <label
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border px-3 py-3 text-sm",
                publishingMode === "REVIEW_ONLY"
                  ? "border-blue-400 bg-blue-50/60"
                  : "border-slate-200"
              )}
            >
              <input
                type="radio"
                name="publishingMode"
                className="mt-1"
                checked={publishingMode === "REVIEW_ONLY"}
                onChange={() => setPublishingMode("REVIEW_ONLY")}
              />
              <span>
                <span className="block font-medium text-slate-900">
                  {t.publishingModeReviewOnlyTitle}
                </span>
                <span className="mt-1 block text-slate-600">
                  {t.publishingModeReviewOnlyDescription}
                </span>
              </span>
            </label>
            <label
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border px-3 py-3 text-sm",
                publishingMode === "AUTO_PUBLISH"
                  ? "border-amber-400 bg-amber-50/70"
                  : "border-slate-200"
              )}
            >
              <input
                type="radio"
                name="publishingMode"
                className="mt-1"
                checked={publishingMode === "AUTO_PUBLISH"}
                onChange={() => setPublishingMode("AUTO_PUBLISH")}
              />
              <span>
                <span className="block font-medium text-slate-900">
                  {t.publishingModeAutoPublishTitle}
                </span>
                <span className="mt-1 block text-slate-600">
                  {t.publishingModeAutoPublishDescription}
                </span>
                <span className="mt-2 block text-xs font-medium text-amber-900">
                  {t.publishingModeAutoPublishWarning}
                </span>
              </span>
            </label>
          </fieldset>

          <Button
            type="button"
            disabled={submitting || selected.size === 0}
            onClick={() => void handleApprove()}
            className="min-h-10 rounded-xl"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t.approveSelected
            )}
          </Button>
        </>
      ) : null}

      <TopicBriefDrawer
        open={detailsItemId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsItemId(null);
        }}
        item={detailsItem}
        locale={locale}
        t={t}
        refreshing={detailsItem ? refreshingItemId === detailsItem.id : false}
        generating={detailsItem ? generatingItemId === detailsItem.id : false}
        canGenerateDraft={detailsCanGenerate}
        onRegenerate={(item) => void handleRegenerateTopic(item)}
        onGenerateDraft={(item) => void handleGenerateDraft(item)}
        onRemove={handleRemoveFromPlan}
      />
    </section>
  );
}
