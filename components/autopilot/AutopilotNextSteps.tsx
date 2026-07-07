"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import type { AutopilotNextStep } from "@/lib/autopilot/types";
import { localizeNextStep } from "@/lib/i18n/saas/plan-display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type AutopilotNextStepsProps = {
  steps: AutopilotNextStep[];
};

export function AutopilotNextSteps({ steps }: AutopilotNextStepsProps) {
  const { dict } = useSaasTranslations();
  const a = dict.autopilot;

  if (steps.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="font-semibold text-white">{a.nextSteps}</h3>
      <ul className="mt-4 space-y-3">
        {steps.map((step) => {
          const copy = localizeNextStep(step, dict);
          return (
          <li key={step.title} className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <div>
              {step.href ? (
                <Link
                  href={step.href}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  {copy.title}
                </Link>
              ) : (
                <p className="font-medium text-white">{copy.title}</p>
              )}
              <p className="text-sm text-slate-400">{copy.description}</p>
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
