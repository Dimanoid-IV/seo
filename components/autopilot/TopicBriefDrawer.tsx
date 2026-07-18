"use client";

import { ExternalLink, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { parseContentResearchBrief } from "@/lib/content-research/parse";
import type { AutopilotPlanItem } from "@/lib/autopilot/plan-item-types";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { localizePlanItemTitle } from "@/lib/i18n/saas/plan-display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type PlanApprovalStrings = ReturnType<
  typeof useSaasTranslations
>["dict"]["autopilot"]["planApproval"];

type TopicBriefDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AutopilotPlanItem | null;
  locale: SaasLocale;
  t: PlanApprovalStrings;
  refreshing: boolean;
  generating: boolean;
  canGenerateDraft: boolean;
  onRegenerate: (item: AutopilotPlanItem) => void;
  onGenerateDraft: (item: AutopilotPlanItem) => void;
  onRemove: (item: AutopilotPlanItem) => void;
};

function formatDate(iso: string | undefined, locale: SaasLocale): string {
  if (!iso) return "—";
  const intlLocale = locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function TopicBriefDrawer({
  open,
  onOpenChange,
  item,
  locale,
  t,
  refreshing,
  generating,
  canGenerateDraft,
  onRegenerate,
  onGenerateDraft,
  onRemove,
}: TopicBriefDrawerProps) {
  const { dict } = useSaasTranslations();
  const d = t.briefDrawer;
  const brief = item?.researchBrief ? parseContentResearchBrief(item.researchBrief) : null;
  const displayTitle = item
    ? brief?.recommendedArticleTitle || localizePlanItemTitle(item, dict)
    : d.title;
  const competitorAngles = brief?.competitors
    .flatMap((competitor) => competitor.contentAngles)
    .filter(Boolean)
    .slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{displayTitle}</SheetTitle>
          <SheetDescription>{d.title}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4 text-sm text-slate-700">
          {!brief ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-500">
              {item?.reason ?? d.noData}
            </p>
          ) : (
            <>
              {item?.reason ? (
                <section>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {d.whyTopic}
                  </h4>
                  <p>{brief.contentGapSummary || item.reason}</p>
                </section>
              ) : null}

              <section className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {d.targetKeyword}
                  </h4>
                  <p>{brief.primaryKeyword || "—"}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {d.searchIntent}
                  </h4>
                  <p className="capitalize">{brief.searchIntent?.toLowerCase() || "—"}</p>
                </div>
              </section>

              {competitorAngles && competitorAngles.length > 0 ? (
                <section>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {d.competitorAngle}
                  </h4>
                  <ul className="list-disc space-y-1 pl-5">
                    {competitorAngles.map((angle, index) => (
                      <li key={index}>{angle}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {brief.outline.length > 0 ? (
                <section>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {d.outline}
                  </h4>
                  <ol className="list-decimal space-y-1 pl-5">
                    {brief.outline.map((heading, index) => (
                      <li key={index}>{heading}</li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {brief.internalLinkSuggestions.length > 0 ? (
                <section>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {d.internalLinks}
                  </h4>
                  <ul className="space-y-1">
                    {brief.internalLinkSuggestions.map((linkUrl, index) => (
                      <li key={index} className="break-all text-slate-600">
                        {linkUrl}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}

          <section>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {d.publishDate}
            </h4>
            <p>{formatDate(item?.scheduledFor ?? item?.estimatedActionDate, locale)}</p>
          </section>

          {item?.generatedArticleId ? (
            <Link
              href={`/app/articles/${item.generatedArticleId}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-800"
            >
              {t.openArticleDraft}
              <ExternalLink className="size-3.5" />
            </Link>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 p-4">
          {item && item.type === "ARTICLE" && item.researchBrief ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={refreshing || generating}
                onClick={() => item && onRegenerate(item)}
              >
                {refreshing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {t.regenerateTopic}
              </Button>
              {canGenerateDraft ? (
                <Button
                  type="button"
                  disabled={refreshing || generating}
                  onClick={() => item && onGenerateDraft(item)}
                >
                  {generating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {t.generateDraftFromResearch}
                </Button>
              ) : null}
            </>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {d.keep}
            </Button>
            {item ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => onRemove(item)}
              >
                <Trash2 className="size-4" />
                {d.remove}
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
