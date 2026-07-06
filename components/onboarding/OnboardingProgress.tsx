import { cn } from "@/lib/utils";

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
  const currentStep = Math.min(completed + 1, total);

  return (
    <div className="saas-card-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-white">
          Step {currentStep} of {total}
        </span>
        <span className="text-slate-400">{percentage}% complete</span>
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
