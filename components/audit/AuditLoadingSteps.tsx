"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type AuditLoadingStepsProps = {
  active: boolean;
};

export function AuditLoadingSteps({ active }: AuditLoadingStepsProps) {
  const { dict } = useSaasTranslations();
  const steps = dict.publicAudit.loadingSteps;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) =>
        current < steps.length - 1 ? current + 1 : current
      );
    }, 2200);

    return () => window.clearInterval(interval);
  }, [active, steps.length]);

  if (!active) {
    return null;
  }

  return (
    <div
      className="marketing-card mx-auto max-w-lg p-6"
      role="status"
      aria-live="polite"
      aria-label={dict.publicAudit.loadingAria}
    >
      <ul className="space-y-4">
        {steps.map((step, index) => {
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <li key={step} className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden />
              ) : isCurrent ? (
                <Loader2
                  className="size-5 shrink-0 animate-spin text-blue-600"
                  aria-hidden
                />
              ) : (
                <Circle className="size-5 shrink-0 text-slate-300" aria-hidden />
              )}
              <span
                className={cn(
                  "text-sm",
                  isComplete && "text-slate-500",
                  isCurrent && "font-medium text-slate-900",
                  !isComplete && !isCurrent && "text-slate-400"
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
