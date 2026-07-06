"use client";

import { cn } from "@/lib/utils";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type OnboardingProgressProps = {
  completed: number;
  total: number;
  percentage: number;
};

export function OnboardingProgress({
  completed,
  total,
  percentage,
}: OnboardingProgressProps) {
  const { dict } = useSaasTranslations();
  const o = dict.onboarding;
  const currentStep = Math.min(completed + 1, total);

  return (
    <div className="saas-card-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-white">
          {o.stepOfTotal
            .replace("{current}", String(currentStep))
            .replace("{total}", String(total))}
        </span>
        <span className="text-slate-400">
          {o.percentComplete.replace("{percent}", String(percentage))}
        </span>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
