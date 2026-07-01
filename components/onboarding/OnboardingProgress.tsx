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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-white">
          Step {currentStep} of {total}
        </span>
        <span className="text-slate-400">{percentage}% complete</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
