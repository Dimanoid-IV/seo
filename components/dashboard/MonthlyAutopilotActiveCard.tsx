"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, ShieldCheck } from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

export type MonthlyAutopilotActiveCardProps = {
  nextArticleDateLabel: string | null;
  readyForReviewCount: number;
  publishingPath: "manual" | "wordpress_draft" | "webhook_ready";
  primaryHref: string;
  primaryLabel: string;
  showPublishingNudge: boolean;
};

export function MonthlyAutopilotActiveCard({
  nextArticleDateLabel,
  readyForReviewCount,
  publishingPath,
  primaryHref,
  primaryLabel,
  showPublishingNudge,
}: MonthlyAutopilotActiveCardProps) {
  const { dict } = useSaasTranslations();
  const t = dict.dashboard.monthlyAutopilot;

  const publishChip =
    publishingPath === "wordpress_draft"
      ? t.chipPublishWordpress
      : publishingPath === "webhook_ready"
        ? t.chipPublishWebhook
        : t.chipPublishManual;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-blue-50/40 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 ring-1 ring-emerald-200">
          <ShieldCheck className="size-5 text-emerald-700" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {t.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-900">
          <CalendarClock className="size-3.5" />
          {nextArticleDateLabel
            ? t.chipNextArticle(nextArticleDateLabel)
            : t.chipNextArticleSoon}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-medium text-amber-900">
          <CheckCircle2 className="size-3.5" />
          {t.chipReadyForReview(readyForReviewCount)}
        </span>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
          {publishChip}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {primaryLabel}
        </Link>
        <Link
          href="/app/integrations"
          className={cn(
            "inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium transition",
            showPublishingNudge
              ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          {t.setupPublishing}
        </Link>
      </div>

      {showPublishingNudge ? (
        <div className="mt-5 rounded-xl border border-blue-200/80 bg-white/70 px-4 py-3">
          <p className="text-sm font-medium text-slate-900">{t.nudgeTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {t.nudgeDescription}
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-slate-500">{t.safetyNote}</p>
    </section>
  );
}
