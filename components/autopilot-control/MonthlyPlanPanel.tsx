"use client";

import Link from "next/link";
import { Loader2, Rocket, Sparkles } from "lucide-react";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";
import { Button } from "@/components/ui/button";
import type { ControlCenterMonthlyPlan } from "@/lib/autopilot-control/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type MonthlyPlanPanelProps = {
  plan?: ControlCenterMonthlyPlan;
  onGenerate?: () => void;
  generating?: boolean;
};

export function MonthlyPlanPanel({
  plan,
  onGenerate,
  generating,
}: MonthlyPlanPanelProps) {
  const { dict } = useSaasTranslations();
  const m = dict.controlCenter.monthlyPlan;

  return (
    <SaasCard variant="muted">
      <SaasSectionHeader title={m.title} subtitle={m.subtitle} />

      {plan ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
              {plan.status}
            </span>
            <span className="text-xs text-slate-500">{plan.month}</span>
          </div>
          <h4 className="font-medium text-white">{plan.title}</h4>
          {plan.summary ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">
              {plan.summary}
            </p>
          ) : null}
          <Button
            render={<Link href={plan.href} />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="rounded-xl border-white/[0.08] bg-white/[0.03] text-slate-200"
          >
            {m.review}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-5 py-8 text-center">
          <Sparkles className="mx-auto size-6 text-violet-400/80" />
          <p className="mt-3 text-sm text-slate-400">{m.empty}</p>
          {onGenerate ? (
            <Button
              type="button"
              size="sm"
              disabled={generating}
              onClick={onGenerate}
              className="mt-5 min-h-10 rounded-xl"
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Rocket className="mr-1.5 size-4" />
                  {dict.controlCenter.generatePlan}
                </>
              )}
            </Button>
          ) : null}
        </div>
      )}
    </SaasCard>
  );
}
