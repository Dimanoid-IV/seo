"use client";

import { BarChart3, Bot, FileText, Search, ShieldCheck, Users } from "lucide-react";

import type { AutopilotStrategySnapshot } from "@/lib/autopilot/strategy-snapshot";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type StrategySnapshotCardProps = {
  snapshot: AutopilotStrategySnapshot;
};

function PillList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function StrategySnapshotCard({ snapshot }: StrategySnapshotCardProps) {
  const { dict } = useSaasTranslations();
  const t = dict.autopilot.strategySnapshot;

  return (
    <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <BarChart3 className="size-3.5" />
            {t.eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {t.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            {snapshot.hasResearch ? t.descriptionWithResearch : t.descriptionBasic}
          </p>
        </div>
        <div className="grid min-w-[220px] grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
            <p className="text-xs text-blue-700">{t.articles}</p>
            <p className="text-xl font-semibold text-slate-900">
              {snapshot.articleCount}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-700">{t.fixes}</p>
            <p className="text-xl font-semibold text-slate-900">
              {snapshot.fixCount}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Search className="size-4 text-blue-600" />
            {t.keywords}
          </div>
          <PillList items={snapshot.keywords} />
          {snapshot.keywords.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t.noKeywords}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="size-4 text-violet-600" />
            {t.competitors}
          </div>
          <PillList items={snapshot.competitors} />
          {snapshot.competitors.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t.noCompetitors}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bot className="size-4 text-emerald-600" />
            {t.geoPrompts}
          </div>
          <PillList items={snapshot.geoPrompts} />
          {snapshot.geoPrompts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t.noGeoPrompts}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileText className="size-4 text-cyan-600" />
            {t.articlePlan}
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {snapshot.articleTitles.slice(0, 3).map((title) => (
              <li key={title} className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
