"use client";

import Link from "next/link";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ResearchBriefPreview } from "@/components/content-research/ResearchBriefPreview";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type {
  AutopilotPlanItem,
  AutopilotPlanItemsDocument,
  AutopilotPlanPeriod,
} from "@/lib/autopilot/plan-item-types";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectableItems = useMemo(
    () => planItems.items.filter(isSelectable),
    [planItems.items]
  );

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

  if (planItems.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {t.emptyItems}
      </div>
    );
  }

  const hasApprovedItems = planItems.items.some(
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
        {planItems.items.map((item) => {
          const checked = selected.has(item.id);
          const selectable = isSelectable(item);
          const statusLabel =
            t.itemStatuses[item.status as keyof typeof t.itemStatuses] ??
            item.status;

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
                  aria-label={item.title}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-violet-600">
                        {t.itemTypes[item.type as keyof typeof t.itemTypes] ?? item.type}
                      </p>
                      <h4 className="font-medium text-slate-900">{item.title}</h4>
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
                  </div>

                  <p className="text-sm text-slate-600">{item.reason}</p>

                  {item.type === "ARTICLE" && item.researchBrief ? (
                    <ResearchBriefPreview
                      researchBrief={item.researchBrief}
                      planId={planId}
                      planItemId={item.id}
                      compact
                    />
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

                  {item.reviewQueueHref &&
                  (item.status === "prepared" || item.type === "TASK_FIX") ? (
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
      ) : null}
    </section>
  );
}
