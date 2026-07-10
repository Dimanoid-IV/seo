"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type ReviewQueueCardProps = {
  count: number;
};

export function ReviewQueueCard({ count }: ReviewQueueCardProps) {
  const { dict } = useSaasTranslations();
  const r = dict.dashboard.reviewQueue;

  const countLabel =
    count > 0
      ? r.countMany.replace("{count}", String(count))
      : r.countZero;

  return (
    <SaasCard variant="muted">
      <SaasSectionHeader title={r.title} subtitle={r.subtitle} />
      <p className="text-2xl font-semibold text-slate-900">{countLabel}</p>
      <Link
        href="/app/review"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
      >
        {r.cta}
        <ArrowRight className="size-4" />
      </Link>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-xs leading-relaxed text-slate-600">
        <ClipboardCheck className="mt-0.5 size-3.5 shrink-0 text-violet-600" />
        <span>{r.safetyNote}</span>
      </div>
    </SaasCard>
  );
}
