import { cn } from "@/lib/utils";

type UsageMeterProps = {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  className?: string;
};

function getBarColor(pct: number): string {
  if (pct >= 90) return "from-red-500 to-orange-400";
  if (pct >= 70) return "from-amber-500 to-yellow-400";
  return "from-blue-500 to-cyan-400";
}

export function UsageMeter({
  label,
  used,
  limit,
  unit,
  className,
}: UsageMeterProps) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const unitSuffix = unit ? ` ${unit}` : "";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm tabular-nums text-slate-400">
          <span className="font-semibold text-slate-900">{used}</span>
          {" / "}
          {limit}
          {unitSuffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            getBarColor(pct)
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label={label}
        />
      </div>
    </div>
  );
}
