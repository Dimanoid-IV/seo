"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AUDIT_LOADING_STEPS } from "@/lib/audit/client-messages";
import { cn } from "@/lib/utils";

type AuditLoadingStepsProps = {
  active: boolean;
};

export function AuditLoadingSteps({ active }: AuditLoadingStepsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) =>
        current < AUDIT_LOADING_STEPS.length - 1 ? current + 1 : current
      );
    }, 2200);

    return () => window.clearInterval(interval);
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div
      className="glass-card mx-auto max-w-lg p-6"
      role="status"
      aria-live="polite"
      aria-label="Проверка сайта"
    >
      <ul className="space-y-4">
        {AUDIT_LOADING_STEPS.map((step, index) => {
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <li key={step} className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden />
              ) : isCurrent ? (
                <Loader2
                  className="size-5 shrink-0 animate-spin text-blue-400"
                  aria-hidden
                />
              ) : (
                <Circle className="size-5 shrink-0 text-slate-600" aria-hidden />
              )}
              <span
                className={cn(
                  "text-sm",
                  isComplete && "text-slate-400",
                  isCurrent && "font-medium text-white",
                  !isComplete && !isCurrent && "text-slate-500"
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
