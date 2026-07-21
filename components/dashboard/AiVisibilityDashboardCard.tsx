"use client";

import Link from "next/link";
import { Bot, MessageSquareText, Sparkles } from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { SimpleDashboardViewModel } from "@/lib/dashboard/simple-overview";

type AiVisibilityDashboardCardProps = {
  snapshot: NonNullable<SimpleDashboardViewModel["aiVisibility"]>;
};

export function AiVisibilityDashboardCard({
  snapshot,
}: AiVisibilityDashboardCardProps) {
  const { dict } = useSaasTranslations();
  const t = dict.dashboard.aiVisibility;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50/60 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <Bot className="size-3.5" />
            {t.eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            {t.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {t.description}
          </p>
        </div>
        <Link
          href={snapshot.href}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {t.openPlan}
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-3">
          <p className="text-xs text-emerald-700">{t.readiness}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {snapshot.readinessScore === null
              ? t.notMeasured
              : `${snapshot.readinessScore}/100`}
          </p>
        </div>
        <div className="rounded-xl border border-cyan-100 bg-white/80 px-3 py-3">
          <p className="text-xs text-cyan-700">{t.prompts}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {snapshot.promptCount}
          </p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-white/80 px-3 py-3">
          <p className="text-xs text-violet-700">{t.platforms}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {snapshot.platformCount}
          </p>
        </div>
      </div>

      {snapshot.prompts.length > 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MessageSquareText className="size-4 text-emerald-600" />
            {t.samplePrompts}
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {snapshot.prompts.map((prompt) => (
              <li key={prompt} className="rounded-lg bg-slate-50 px-3 py-2">
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 inline-flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
        <span>{t.statuses[snapshot.status]}</span>
      </p>
    </section>
  );
}
