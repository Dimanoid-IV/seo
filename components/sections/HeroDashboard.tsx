"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  Search,
  MapPin,
  Settings,
  FileText,
  Activity,
} from "lucide-react";
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
        <div className="glass-card glow-sm overflow-hidden p-1">
          <div className="rounded-xl bg-[#0a0f1e] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-400">{d.live}</span>
              </div>
              <span className="text-xs text-slate-500">RankBoost Analytics</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{d.organicTraffic}</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-400">
                      {d.organicTrafficValue}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-400/60" />
                </div>
                <div className="mt-3 flex h-8 items-end gap-1">
                  {[40, 55, 45, 70, 60, 85, 75, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-emerald-600/40 to-emerald-400/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4"
              >
                <p className="text-xs text-slate-400">{d.seoScore}</p>
                <p className="mt-1 text-xl font-bold gradient-text">{d.seoScoreValue}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4"
              >
                <p className="text-xs text-slate-400">{d.keywordsGrowth}</p>
                <div className="mt-2 flex items-center gap-1">
                  <BarChart3 className="h-5 w-5 text-violet-400" />
                  <span className="text-lg font-bold text-violet-300">+124</span>
                </div>
              </motion.div>
            </div>

            <div className="mt-3 space-y-2">
              {[
                { icon: Search, label: d.googleVisibility, pct: 72, color: "blue" },
                { icon: Settings, label: d.technicalSeo, pct: 91, color: "cyan" },
                { icon: FileText, label: d.contentStrategy, pct: 78, color: "violet" },
                { icon: MapPin, label: d.localSeo, pct: 85, color: "emerald" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 text-xs text-slate-300">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-400`}
                        style={{
                          width: `${item.pct}%`,
                          background:
                            item.color === "blue"
                              ? "linear-gradient(to right, #3b82f6, #06b6d4)"
                              : item.color === "cyan"
                                ? "linear-gradient(to right, #06b6d4, #22d3ee)"
                                : item.color === "violet"
                                  ? "linear-gradient(to right, #8b5cf6, #a78bfa)"
                                  : "linear-gradient(to right, #10b981, #34d399)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-400">{item.pct}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-4 -right-4 glass-card px-3 py-2 glow-sm"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white">+12 leads/mo</span>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute -bottom-3 -left-4 glass-card px-3 py-2"
        >
          <span className="text-xs text-slate-300">
            <span className="font-bold text-blue-400">Top 3</span> Google Maps
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
