"use client";

import { AlertTriangle } from "lucide-react";

import type { AutopilotRisk } from "@/lib/autopilot/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type AutopilotRisksCardProps = {
  risks: AutopilotRisk[];
};

export function AutopilotRisksCard({ risks }: AutopilotRisksCardProps) {
  const { dict } = useSaasTranslations();
  const a = dict.autopilot;

  if (risks.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-5 text-amber-400" />
        <h3 className="font-semibold text-white">{a.risksTitle}</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {risks.map((risk) => (
          <li
            key={risk.title}
            className="rounded-lg border border-white/5 bg-black/20 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span
                className={
                  risk.severity === "ERROR"
                    ? "text-xs font-semibold uppercase text-red-400"
                    : "text-xs font-semibold uppercase text-amber-400"
                }
              >
                {risk.severity}
              </span>
              <span className="font-medium text-slate-200">{risk.title}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{risk.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
