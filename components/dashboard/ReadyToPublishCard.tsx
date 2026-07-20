"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Send } from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { SimpleDashboardViewModel } from "@/lib/dashboard/simple-overview";

type ReadyToPublishCardProps = {
  article: NonNullable<SimpleDashboardViewModel["readyToPublish"]>;
};

export function ReadyToPublishCard({ article }: ReadyToPublishCardProps) {
  const { dict } = useSaasTranslations();
  const t = dict.dashboard.readyToPublish;

  const chip =
    article.publishingPath === "webhook_ready"
      ? t.webhookChip
      : article.publishingPath === "wordpress_draft" ||
          article.publishingPath === "wordpress_live"
        ? t.wordpressChip
        : t.manualChip;

  const description =
    article.publishingPath === "webhook_ready"
      ? t.descriptionWebhook(article.siteLabel)
      : article.publishingPath === "wordpress_draft" ||
          article.publishingPath === "wordpress_live"
        ? t.descriptionWordpress
        : t.descriptionManual;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            {t.eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {t.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {description}
          </p>
          <p className="mt-3 line-clamp-2 text-sm font-medium text-slate-900">
            {article.title}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <span className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            {chip}
          </span>
          <Link
            href={article.href}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Send className="size-4" />
            {t.openArticle}
          </Link>
          <Link
            href="/app/review"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            {t.openReview}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {t.safetyNote}
      </p>
    </section>
  );
}
