"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { SimpleDashboardViewModel } from "@/lib/dashboard/simple-overview";
import { cn } from "@/lib/utils";

type DashboardHeroProps = {
  status: SimpleDashboardViewModel["status"];
  websiteDomain?: string;
};

const TONE_STYLES: Record<
  SimpleDashboardViewModel["status"]["tone"],
  string
> = {
  GOOD: "from-emerald-500/20 to-blue-500/10 border-emerald-500/20",
  NEEDS_REVIEW: "from-amber-500/20 to-violet-500/10 border-amber-500/20",
  SETUP: "from-blue-500/20 to-violet-500/10 border-blue-500/20",
  NO_DATA: "from-slate-500/20 to-blue-500/10 border-white/10",
};

export function DashboardHero({ status, websiteDomain }: DashboardHeroProps) {
  return (
    <section
      className={cn(
        "glass-card border bg-gradient-to-br p-6 sm:p-8",
        TONE_STYLES[status.tone]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Sparkles className="size-5 text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Your website growth overview
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            {status.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            {status.description}
          </p>
          {websiteDomain ? (
            <p className="mt-3 break-all text-xs text-slate-500">{websiteDomain}</p>
          ) : null}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        RankBoost is monitoring your website and preparing growth actions.{" "}
        <Link
          href="/app/autopilot-control"
          className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
        >
          Open Control Center
          <ArrowRight className="size-3" />
        </Link>
      </p>
    </section>
  );
}
