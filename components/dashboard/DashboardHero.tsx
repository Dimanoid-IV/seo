"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { SimpleDashboardViewModel } from "@/lib/dashboard/simple-overview";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type DashboardHeroProps = {
  status: SimpleDashboardViewModel["status"];
  websiteDomain?: string;
};

const TONE_STYLES: Record<
  SimpleDashboardViewModel["status"]["tone"],
  string
> = {
  GOOD: "border-emerald-500/15 from-emerald-500/[0.12] to-blue-500/[0.06]",
  NEEDS_REVIEW: "border-amber-500/15 from-amber-500/[0.12] to-violet-500/[0.06]",
  SETUP: "border-blue-500/15 from-blue-500/[0.12] to-violet-500/[0.06]",
  NO_DATA: "border-white/[0.08] from-white/[0.06] to-blue-500/[0.04]",
};

export function DashboardHero({ status, websiteDomain }: DashboardHeroProps) {
  const { dict } = useSaasTranslations();
  const d = dict.dashboard;

  return (
    <section
      className={cn(
        "saas-card-hero border bg-gradient-to-br",
        TONE_STYLES[status.tone]
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] ring-1 ring-white/10">
            <Sparkles className="size-5 text-blue-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="saas-eyebrow">{d.heroUi.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
              {status.label}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-[0.9375rem]">
              {status.description}
            </p>
            {websiteDomain ? (
              <p className="mt-4 break-all text-xs text-slate-500">
                {websiteDomain}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-6 border-t border-white/[0.06] pt-5 text-sm leading-relaxed text-slate-400">
        {d.heroUi.monitoringNote}{" "}
        <Link
          href="/app/autopilot-control"
          className="inline-flex items-center gap-1 font-medium text-blue-300 transition hover:text-blue-200"
        >
          {d.prepared.openControlCenter}
          <ArrowRight className="size-3.5" />
        </Link>
      </p>
    </section>
  );
}
