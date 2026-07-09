"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { translatePreparedPlanStatus } from "@/lib/i18n/saas/statuses";

type PreparedForYouCardProps = {
  monthlyPlanStatus?: string;
  articleDraftsCount: number;
  socialPostsCount: number;
  emailApprovalsCount: number;
};

function formatPlanStatus(
  locale: import("@/lib/i18n/saas/locales").SaasLocale,
  status?: string
): string {
  return translatePreparedPlanStatus(locale, status);
}

export function PreparedForYouCard({
  monthlyPlanStatus,
  articleDraftsCount,
  socialPostsCount,
  emailApprovalsCount,
}: PreparedForYouCardProps) {
  const { dict, locale } = useSaasTranslations();
  const p = dict.dashboard.prepared;

  const rows = [
    { label: p.monthlyPlan, value: formatPlanStatus(locale, monthlyPlanStatus) },
    { label: p.articleDrafts, value: String(articleDraftsCount) },
    { label: p.socialPosts, value: String(socialPostsCount) },
    { label: p.reviewEmails, value: String(emailApprovalsCount) },
  ];

  return (
    <SaasCard variant="muted">
      <SaasSectionHeader
        title={p.title}
        subtitle={dict.trust.aiDraftSafety}
      />
      <dl className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm"
          >
            <dt className="text-slate-400">{row.label}</dt>
            <dd className="font-medium text-slate-100">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex items-start gap-2 rounded-xl border border-violet-500/10 bg-violet-500/[0.04] px-4 py-3 text-xs leading-relaxed text-slate-400">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-violet-300/80" />
        <span>{p.reviewNote}</span>
      </div>
      <Link
        href="/app/autopilot-control"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-300 transition hover:text-blue-200"
      >
        {p.openControlCenter}
        <ArrowRight className="size-4" />
      </Link>
    </SaasCard>
  );
}
