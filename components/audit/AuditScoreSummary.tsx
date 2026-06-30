import { GrowthScoreGauge } from "@/components/dashboard/GrowthScoreGauge";
import { AUDIT_SCORE_LABELS } from "@/lib/audit/client-messages";
import type { ScoreLabel } from "@/lib/audit/preview-response";
import { cn } from "@/lib/utils";

type AuditScoreSummaryProps = {
  rawScore: number;
  label: ScoreLabel;
  className?: string;
};

const labelAccent: Record<ScoreLabel, string> = {
  poor: "text-red-300",
  needs_work: "text-amber-300",
  good: "text-cyan-300",
  strong: "text-emerald-300",
};

export function AuditScoreSummary({
  rawScore,
  label,
  className,
}: AuditScoreSummaryProps) {
  return (
    <div
      className={cn(
        "glass-card flex flex-col items-center gap-4 border border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8",
        className
      )}
    >
      <GrowthScoreGauge
        score={rawScore}
        label="Growth Score preview"
        size="lg"
      />

      <div className="max-w-md text-center sm:text-left">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Оценка сайта
        </p>
        <p className={cn("mt-2 text-xl font-semibold", labelAccent[label])}>
          {AUDIT_SCORE_LABELS[label]}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Это предварительная оценка по 20 техническим и контентным проверкам.
          Полный план роста доступен после регистрации.
        </p>
      </div>
    </div>
  );
}
