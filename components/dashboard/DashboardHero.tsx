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
  GOOD: "border-emerald-200 from-emerald-50/90 to-blue-50/50",
  NEEDS_REVIEW: "border-amber-200 from-amber-50/90 to-violet-50/40",
  SETUP: "border-[#c9bfff]/55 from-[#c9bfff]/20/90 to-violet-50/40",
  NO_DATA: "border-slate-200 from-slate-50/90 to-blue-50/30",
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
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#c9bfff]/20 ring-1 ring-[#c9bfff]/45">
            <Sparkles className="size-5 text-[#8169ff]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="saas-eyebrow">{d.heroUi.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
              {status.label}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
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
      <p className="mt-6 border-t border-slate-200 pt-5 text-sm leading-relaxed text-slate-600">
        {d.heroUi.monitoringNote}{" "}
        <Link
          href="/app/autopilot-control"
          className="inline-flex items-center gap-1 font-medium text-[#8169ff] transition hover:text-[#6d4ff0]"
        >
          {d.prepared.openControlCenter}
          <ArrowRight className="size-3.5" />
        </Link>
      </p>
    </section>
  );
}
