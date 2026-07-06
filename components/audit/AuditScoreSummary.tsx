"use client";

import { GrowthScoreGauge } from "@/components/dashboard/GrowthScoreGauge";
import { getAuditScoreLabel } from "@/lib/audit/client-messages";
import type { ScoreLabel } from "@/lib/audit/preview-response";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type AuditScoreSummaryProps = {
  rawScore: number;
  label: ScoreLabel;
  className?: string;
};

const labelAccent: Record<ScoreLabel, string> = {
  poor: "text-red-600",
  needs_work: "text-amber-600",
  good: "text-cyan-600",
  strong: "text-emerald-600",
};

export function AuditScoreSummary({
  rawScore,
  label,
  className,
}: AuditScoreSummaryProps) {
  const { dict, locale } = useSaasTranslations();
  const a = dict.publicAudit;

  return (
    <div
      className={cn(
        "marketing-card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8",
        className
      )}
    >
      <GrowthScoreGauge score={rawScore} label={a.scorePreviewLabel} size="lg" />

      <div className="max-w-md text-center sm:text-left">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {a.scoreTitle}
        </p>
        <p className={cn("mt-2 text-xl font-semibold", labelAccent[label])}>
          {getAuditScoreLabel(label, locale)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {a.scoreDescription}
        </p>
      </div>
    </div>
  );
}
