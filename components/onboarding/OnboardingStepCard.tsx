import { Check, Circle, Lock, SkipForward } from "lucide-react";

import { cn } from "@/lib/utils";
import type { OnboardingStepViewModel } from "@/lib/onboarding/types";

type OnboardingStepCardProps = {
  step: OnboardingStepViewModel;
  children?: React.ReactNode;
};

function statusIcon(status: OnboardingStepViewModel["status"]) {
  switch (status) {
    case "DONE":
      return <Check className="size-4 text-emerald-400" />;
    case "SKIPPED":
      return <SkipForward className="size-4 text-slate-400" />;
    case "LOCKED":
      return <Lock className="size-4 text-slate-500" />;
    default:
      return <Circle className="size-4 text-violet-400" />;
  }
}

export function OnboardingStepCard({ step, children }: OnboardingStepCardProps) {
  const isActive = step.status === "CURRENT" || step.status === "OPTIONAL";

  return (
    <section
      className={cn(
        "rounded-2xl border p-5 transition-colors",
        isActive
          ? "border-violet-500/30 bg-violet-500/10"
          : step.status === "DONE"
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-white/10 bg-white/[0.02] opacity-90"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0a0f1e]/80">
          {statusIcon(step.status)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{step.title}</h3>
            {step.optional ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                Optional
              </span>
            ) : null}
            {step.status === "DONE" ? (
              <span className="text-xs text-emerald-300">Done</span>
            ) : null}
            {step.status === "SKIPPED" ? (
              <span className="text-xs text-slate-400">Skipped</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">{step.description}</p>
          {children ? <div className="mt-4">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
