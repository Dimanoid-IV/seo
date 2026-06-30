import { Clock, TrendingDown } from "lucide-react";

import {
  AUDIT_SEVERITY_LABELS,
  formatFixMinutes,
} from "@/lib/audit/client-messages";
import type { AuditPreviewIssue } from "@/lib/audit/preview-response";
import { cn } from "@/lib/utils";

type AuditIssueCardProps = {
  issue: AuditPreviewIssue;
};

const severityStyles: Record<string, string> = {
  CRITICAL: "border-red-500/30 bg-red-500/5",
  HIGH: "border-orange-500/30 bg-orange-500/5",
  MEDIUM: "border-amber-500/30 bg-amber-500/5",
  LOW: "border-blue-500/20 bg-blue-500/5",
  INFO: "border-slate-500/20 bg-white/[0.02]",
};

export function AuditIssueCard({ issue }: AuditIssueCardProps) {
  const severityLabel =
    AUDIT_SEVERITY_LABELS[issue.severity] ?? issue.severity;

  return (
    <article
      className={cn(
        "glass-card flex flex-col gap-4 border p-5",
        severityStyles[issue.severity] ?? severityStyles.INFO
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-white">
          {issue.title}
        </h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">
          {severityLabel}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-slate-400">{issue.whyItMatters}</p>

      <div className="rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Что сделать
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
          {issue.recommendation}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <TrendingDown className="size-3.5 text-amber-400" aria-hidden />
          Влияние на score: −{issue.scoreImpact}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 text-cyan-400" aria-hidden />
          Примерно {formatFixMinutes(issue.estimatedFixMinutes)}
        </span>
      </div>
    </article>
  );
}
