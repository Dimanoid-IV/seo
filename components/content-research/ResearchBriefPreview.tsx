"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { parseContentResearchBrief } from "@/lib/content-research/parse";
import {
  getResearchDisplayStatus,
  toResearchBriefSummary,
  type ContentResearchBriefSummary,
} from "@/lib/content-research/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type ResearchBriefPreviewProps = {
  researchBrief?: Record<string, unknown>;
  planId?: string;
  planItemId?: string;
  onRefreshed?: (summary: ContentResearchBriefSummary) => void;
  compact?: boolean;
};

export function ResearchBriefPreview({
  researchBrief,
  planId,
  planItemId,
  onRefreshed,
  compact = false,
}: ResearchBriefPreviewProps) {
  const { dict } = useSaasTranslations();
  const t = dict.contentResearch;
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = researchBrief
    ? parseContentResearchBrief(researchBrief)
    : null;

  if (!parsed) {
    return null;
  }

  const summary = toResearchBriefSummary(parsed);
  const statusKey = summary.displayStatus;

  async function handleRefresh() {
    if (!planId || !planItemId) {
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const response = await authFetch(
        `/api/autopilot/monthly/${planId}/research-brief`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: planItemId }),
        }
      );

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.refreshFailed));
        return;
      }

      const body = (await response.json()) as {
        data: { summary: ContentResearchBriefSummary };
      };
      onRefreshed?.(body.data.summary);
    } catch {
      setError(t.refreshNetworkError);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-100 bg-slate-50/80",
        compact ? "p-2.5" : "p-3"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {t.title}
        </p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            statusKey === "ready"
              ? "bg-emerald-100 text-emerald-800"
              : statusKey === "blocked"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
          )}
        >
          {t.statuses[statusKey]}
        </span>
      </div>

      <dl className={cn("grid gap-1.5 text-xs text-slate-600", compact ? "gap-1" : "gap-1.5")}>
        <div>
          <dt className="font-medium text-slate-700">{t.primaryKeyword}</dt>
          <dd>{summary.primaryKeyword || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">{t.buyerQuestion}</dt>
          <dd className="line-clamp-2">{summary.buyerQuestion || "—"}</dd>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div>
            <dt className="inline font-medium text-slate-700">{t.geoPrompts}: </dt>
            <dd className="inline">{summary.geoPromptCount}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">{t.competitors}: </dt>
            <dd className="inline">
              {summary.competitorsUnavailable
                ? t.competitorsUnavailable
                : summary.competitorCount}
            </dd>
          </div>
        </div>
      </dl>

      {statusKey === "blocked" ? (
        <p className="mt-2 text-xs leading-relaxed text-red-800">
          {parsed.blockedReason ?? t.blockedHint}
        </p>
      ) : null}

      {!compact ? (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          {statusKey === "blocked" ? t.blockedPageFixHint : t.hint}
        </p>
      ) : null}

      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}

      {planId && planItemId ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-7 px-2 text-xs"
          disabled={refreshing}
          onClick={() => void handleRefresh()}
        >
          <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
          {t.refresh}
        </Button>
      ) : null}
    </div>
  );
}

export function researchSummaryFromBrief(
  researchBrief?: Record<string, unknown>
): ContentResearchBriefSummary | null {
  const parsed = researchBrief
    ? parseContentResearchBrief(researchBrief)
    : null;
  return parsed ? toResearchBriefSummary(parsed) : null;
}

export { getResearchDisplayStatus };
