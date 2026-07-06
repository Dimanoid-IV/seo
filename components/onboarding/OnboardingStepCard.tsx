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
        "rounded-2xl border p-6 transition-all duration-200 sm:p-7",
        isActive
          ? "border-violet-500/25 bg-gradient-to-br from-violet-500/[0.1] to-blue-500/[0.04] shadow-[0_8px_32px_-12px_rgba(139,92,246,0.2)]"
          : step.status === "DONE"
            ? "border-emerald-500/15 bg-emerald-500/[0.04]"
            : "border-white/[0.06] bg-white/[0.015] opacity-90"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#0a0f1e]/80">
          {statusIcon(step.status)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-white">
              {step.title}
            </h3>
            {step.optional ? (
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Optional
              </span>
            ) : null}
            {step.status === "DONE" ? (
              <span className="text-xs font-medium text-emerald-300/90">Done</span>
            ) : null}
            {step.status === "SKIPPED" ? (
              <span className="text-xs text-slate-400">Skipped</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {step.description}
          </p>
          {children ? <div className="mt-5">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
