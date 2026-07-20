"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, FileText, Wrench } from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { SimpleDashboardViewModel } from "@/lib/dashboard/simple-overview";

type MonthlyPlanPreviewCardProps = {
  plan: NonNullable<SimpleDashboardViewModel["monthlyPlanPreview"]>;
};

function formatShortDate(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(
    locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-US",
    { day: "numeric", month: "short" }
  );
}

export function MonthlyPlanPreviewCard({ plan }: MonthlyPlanPreviewCardProps) {
  const { dict, locale } = useSaasTranslations();
  const t = dict.dashboard.monthlyPlanPreview;

  const hasArticles = plan.articleTopics.length > 0;
  const hasFixes = plan.fixItems.length > 0;
  const hiddenItemsCount = Math.max(
    0,
    plan.totalItems - plan.articleTopics.length - plan.fixItems.length
  );

  return (
    <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-violet-50/50 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
            {plan.isApproved ? t.eyebrowApproved : t.eyebrowNeedsApproval}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {t.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {plan.isApproved ? t.descriptionApproved : t.descriptionDraft}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full border border-blue-200 bg-white/80 px-2.5 py-1 text-blue-800">
              {t.topicCount(plan.articleTopics.length)}
            </span>
            <span className="rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-amber-800">
              {t.fixCount(plan.fixItems.length)}
            </span>
            {hiddenItemsCount > 0 ? (
              <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-600">
                {t.moreItems(hiddenItemsCount)}
              </span>
            ) : null}
          </div>
        </div>
        <Link
          href={plan.href}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {plan.isApproved ? t.openPlan : t.confirmPlan}
        </Link>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileText className="size-4 text-blue-600" />
            {t.articleTopics}
          </div>
          {hasArticles ? (
            <ul className="mt-3 space-y-2.5">
              {plan.articleTopics.map((item) => {
                const dateLabel = formatShortDate(item.scheduledFor, locale);
                return (
                  <li key={item.id} className="rounded-lg bg-white px-3 py-2">
                    <p className="text-sm font-medium leading-snug text-slate-900">
                      {item.title}
                    </p>
                    {item.reason ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {item.reason}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        {t.status(item.status)}
                      </span>
                      {dateLabel ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5" />
                          {dateLabel}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t.noArticles}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Wrench className="size-4 text-amber-600" />
            {t.siteFixes}
          </div>
          {hasFixes ? (
            <ul className="mt-3 space-y-2.5">
              {plan.fixItems.map((item) => (
                <li key={item.id} className="rounded-lg bg-white px-3 py-2">
                  <p className="text-sm font-medium leading-snug text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.status(item.status)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t.noFixes}</p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {plan.isApproved ? t.approvedNote : t.draftNote}
      </p>
    </section>
  );
}
