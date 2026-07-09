"use client";

import Link from "next/link";
import { ArrowRight, Plug, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ControlCenterStatus } from "@/lib/autopilot-control/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type ControlStatusHeroProps = {
  status: ControlCenterStatus;
  hasWebsite: boolean;
  onGeneratePlan?: () => void;
  generating?: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  NEEDS_REVIEW:
    "border-amber-200 from-amber-50/90 to-orange-50/50",
  READY: "border-emerald-200 from-emerald-50/90 to-teal-50/50",
  NEEDS_SETUP: "border-blue-200 from-blue-50/90 to-violet-50/50",
  NO_DATA: "border-slate-200 from-slate-50/90 to-blue-50/30",
};

export function ControlStatusHero({
  status,
  hasWebsite,
  onGeneratePlan,
  generating,
}: ControlStatusHeroProps) {
  const { dict } = useSaasTranslations();
  const c = dict.controlCenter;
  const style = STATUS_STYLES[status.overall] ?? STATUS_STYLES.NEEDS_SETUP;

  return (
    <section
      className={cn("saas-card-hero border bg-gradient-to-br", style)}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="size-5 text-violet-400" />
            <span className="saas-eyebrow text-violet-300/80">{status.label}</span>
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {status.description}
          </h2>
        </div>

        {hasWebsite ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {onGeneratePlan ? (
              <Button
                type="button"
                size="sm"
                disabled={generating}
                onClick={onGeneratePlan}
                className="min-h-10 rounded-xl"
              >
                {c.generatePlan}
              </Button>
            ) : null}
            <Button
              render={<Link href="/app/timeline" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="min-h-10 gap-1 rounded-xl border-slate-200 bg-white text-slate-700"
            >
              {c.openTimeline}
              <ArrowRight className="size-3.5" />
            </Button>
            <Button
              render={<Link href="/app/integrations" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="min-h-10 gap-1 rounded-xl border-slate-200 bg-white text-slate-700"
            >
              <Plug className="size-3.5" />
              {c.openIntegrations}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
