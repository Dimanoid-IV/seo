"use client";

import type { MonthlyAutopilotPlanViewModel } from "@/lib/autopilot/types";
import {
  buildLocalizedPlanSummary,
  localizePlanTitle,
} from "@/lib/i18n/saas/plan-display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type AutopilotSummaryCardProps = {
  plan: MonthlyAutopilotPlanViewModel;
  monthLabel: string;
};

export function AutopilotSummaryCard({ plan, monthLabel }: AutopilotSummaryCardProps) {
  const { dict } = useSaasTranslations();
  const a = dict.autopilot;
  const statusLabel =
    a.statuses[plan.status as keyof typeof a.statuses] ?? plan.status;
  const title = localizePlanTitle(monthLabel, plan.title, dict);
  const summary = buildLocalizedPlanSummary(plan, dict);

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-500/10 to-blue-500/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            {monthLabel}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
          {statusLabel}
        </span>
      </div>
      {summary ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-600">{summary}</p>
      ) : null}
      <p className="mt-4 text-xs text-slate-500">
        {a.createdLabel} {new Date(plan.createdAt).toLocaleDateString()} · {a.updatedLabel}{" "}
        {new Date(plan.updatedAt).toLocaleDateString()}
      </p>
    </section>
  );
}
