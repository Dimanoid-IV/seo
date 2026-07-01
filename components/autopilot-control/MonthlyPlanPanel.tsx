import Link from "next/link";
import { Loader2, Rocket, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ControlCenterMonthlyPlan } from "@/lib/autopilot-control/types";

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
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2">
        <Rocket className="size-4 text-violet-400" />
        <h3 className="font-semibold text-white">Monthly plan</h3>
      </div>

      {plan ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-violet-200">
              {plan.status}
            </span>
            <span className="text-xs text-slate-500">{plan.month}</span>
          </div>
          <h4 className="font-medium text-white">{plan.title}</h4>
          {plan.summary ? (
            <p className="text-sm text-slate-400 line-clamp-3">{plan.summary}</p>
          ) : null}
          <Button
            render={<Link href={plan.href} />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="border-white/10 bg-transparent text-slate-200"
          >
            Open Autopilot
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-400">
            No monthly plan yet. Generate a monthly plan to organize this
            month&apos;s SEO, content, and social actions.
          </p>
          {onGenerate ? (
            <Button
              type="button"
              size="sm"
              disabled={generating}
              onClick={onGenerate}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Generate monthly plan
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
