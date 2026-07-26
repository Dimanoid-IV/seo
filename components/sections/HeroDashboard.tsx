"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";

type HeroDashboardProps = {
  dict: Dictionary;
};

export function HeroDashboard({ dict }: HeroDashboardProps) {
  const d = dict.hero.dashboard;

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative"
      >
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]">
          <div className="rounded-2xl bg-[#0a0f1e] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#8169ff]">
                  <Sparkles className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    RankBoost
                  </p>
                  <p className="text-xs font-medium text-slate-300">{d.overview}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                {d.status}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/10 p-4">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  {d.growthScore}
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-300">
                  {d.growthScoreValue}
                </p>
              </div>
              <div className="rounded-xl border border-[#c9bfff]/40 bg-[#c9bfff]/10 p-4">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  {d.opportunities}
                </p>
                <p className="mt-1 text-lg font-semibold text-violet-700">
                  {d.opportunitiesValue}
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/10 p-4">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  {d.needsReview}
                </p>
                <p className="mt-1 text-lg font-semibold text-amber-200">
                  {d.needsReviewValue}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#c9bfff]/40 bg-[#c9bfff]/10 p-4">
              <p className="text-[10px] font-medium uppercase tracking-wide text-violet-700/80">
                {d.nextAction}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{d.nextActionValue}</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {d.prepared}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {d.preparedItems}
              </p>
            </div>

            <p className="mt-4 flex items-center gap-1 text-[10px] text-slate-500">
              Illustrative preview · not real customer data
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
