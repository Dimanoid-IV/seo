"use client";

import { Clock, TrendingDown } from "lucide-react";

import { formatFixMinutes } from "@/lib/audit/client-messages";
import type { AuditPreviewIssue } from "@/lib/audit/preview-response";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type AuditIssueCardProps = {
  issue: AuditPreviewIssue;
};

const severityStyles: Record<string, string> = {
  CRITICAL: "border-red-200 bg-red-50/80",
  HIGH: "border-orange-200 bg-orange-50/80",
  MEDIUM: "border-amber-200 bg-amber-50/80",
  LOW: "border-blue-200 bg-blue-50/50",
  INFO: "border-slate-200 bg-slate-50/80",
};

export function AuditIssueCard({ issue }: AuditIssueCardProps) {
  const { dict, locale } = useSaasTranslations();
  const a = dict.publicAudit;
  const severityLabel =
    a.severityLabels[issue.severity] ?? issue.severity;

  return (
    <article
      className={cn(
        "marketing-card flex flex-col gap-4 border p-5",
        severityStyles[issue.severity] ?? severityStyles.INFO
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-slate-900">
          {issue.title}
        </h3>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {severityLabel}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-slate-600">{issue.whyItMatters}</p>

      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {a.whatToDo}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
          {issue.recommendation}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <TrendingDown className="size-3.5 text-amber-600" aria-hidden />
          {a.scoreImpact(issue.scoreImpact)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 text-cyan-600" aria-hidden />
          {a.approxFixTime(formatFixMinutes(issue.estimatedFixMinutes, locale))}
        </span>
      </div>
    </article>
  );
}
