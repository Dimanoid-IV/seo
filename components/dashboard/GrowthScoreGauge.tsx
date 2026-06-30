import { cn } from "@/lib/utils";

type GrowthScoreGaugeProps = {
  score: number;
  maxScore?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeConfig = {
  sm: { outer: 88, stroke: 6, fontSize: "text-lg" },
  md: { outer: 120, stroke: 8, fontSize: "text-2xl" },
  lg: { outer: 160, stroke: 10, fontSize: "text-3xl" },
};

export function GrowthScoreGauge({
  score,
  maxScore = 100,
  label = "Growth Score",
  size = "md",
  className,
}: GrowthScoreGaugeProps) {
  const clamped = Math.min(Math.max(score, 0), maxScore);
  const pct = (clamped / maxScore) * 100;
  const { outer, stroke, fontSize } = sizeConfig[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: outer, height: outer }}>
        <svg
          width={outer}
          height={outer}
          viewBox={`0 0 ${outer} ${outer}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="url(#growthGaugeGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
          <defs>
            <linearGradient id="growthGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold tabular-nums text-white", fontSize)}>
            {Math.round(clamped)}
          </span>
          <span className="text-[10px] text-slate-500">/ {maxScore}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}
