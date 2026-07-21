"use client";

import Link from "next/link";
import { ArrowRight, MessageSquareText, Search, ShieldCheck } from "lucide-react";

import type { SimpleDashboardViewModel } from "@/lib/dashboard/simple-overview";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type CommunityVisibilityDashboardCardProps = {
  snapshot: NonNullable<SimpleDashboardViewModel["communityVisibility"]>;
};

export function CommunityVisibilityDashboardCard({
  snapshot,
}: CommunityVisibilityDashboardCardProps) {
  const { dict } = useSaasTranslations();
  const t = dict.dashboard.communityVisibility;
  const channels = dict.autopilot.communityVisibility.channels;

  return (
    <section className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50/50 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-700">
            <MessageSquareText className="size-3.5" />
            {t.eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            {t.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {snapshot.hasEnoughSignal ? t.description : t.descriptionBasic}
          </p>
        </div>
        <Link
          href={snapshot.href}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          {t.openPlan}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full border border-cyan-200 bg-white/80 px-2.5 py-1 text-cyan-800">
          {t.opportunityCount(snapshot.opportunityCount)}
        </span>
        {snapshot.sourceKeywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-700"
          >
            {keyword}
          </span>
        ))}
      </div>

      {snapshot.queries.length > 0 ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-3">
          {snapshot.queries.map((item) => (
            <div
              key={`${item.channel}-${item.query}`}
              className="rounded-xl border border-slate-200 bg-white/80 p-3"
            >
              <p className="text-xs font-semibold text-cyan-700">
                {channels[item.channel]}
              </p>
              <p className="mt-1 flex items-start gap-1.5 break-words font-mono text-[11px] leading-relaxed text-slate-700">
                <Search className="mt-0.5 size-3 shrink-0 text-slate-400" />
                {item.query}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <p className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>{t.safetyNote}</span>
      </p>
    </section>
  );
}
