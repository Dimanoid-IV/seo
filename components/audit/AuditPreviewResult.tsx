"use client";

import Link from "next/link";
import { ArrowRight, Clock, FileText, Gauge, Heading1 } from "lucide-react";

import { AuditIssueCard } from "@/components/audit/AuditIssueCard";
import { AuditScoreSummary } from "@/components/audit/AuditScoreSummary";
import { buttonVariants } from "@/components/ui/button";
import { formatFixMinutes } from "@/lib/audit/client-messages";
import type { AuditPreviewResponseData } from "@/lib/audit/preview-response";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type AuditPreviewResultProps = {
  data: AuditPreviewResponseData;
  previewToken?: string | null;
  onCheckAnother: () => void;
};

export function AuditPreviewResult({
  data,
  previewToken,
  onCheckAnother,
}: AuditPreviewResultProps) {
  const { dict, locale } = useSaasTranslations();
  const a = dict.publicAudit;

  const registerParams = new URLSearchParams({
    website: data.url.final,
  });
  if (previewToken) {
    registerParams.set("previewToken", previewToken);
  }
  const registerHref = `/register?${registerParams.toString()}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <AuditScoreSummary rawScore={data.score.raw} label={data.score.label} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Gauge}
          label={a.statResponseTime}
          value={`${data.summary.responseTimeMs} ms`}
        />
        <StatTile
          icon={FileText}
          label={a.statWordCount}
          value={String(data.summary.wordCount)}
        />
        <StatTile
          icon={Heading1}
          label={a.statH1Count}
          value={String(data.summary.h1Count)}
        />
        <StatTile
          icon={Clock}
          label={a.statFixEstimate}
          value={formatFixMinutes(data.summary.estimatedFixMinutes, locale)}
        />
      </div>

      {data.previewIssues.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{a.issuesTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {a.issuesSubtitle(data.previewIssues.length)}
            </p>
          </div>
          <div className="space-y-4">
            {data.previewIssues.map((issue) => (
              <AuditIssueCard key={`${issue.code}-${issue.title}`} issue={issue} />
            ))}
          </div>
        </section>
      ) : (
        <div className="marketing-card border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-slate-700">
          {a.noIssues}
        </div>
      )}

      <div className="marketing-card flex flex-col items-start gap-4 border border-blue-200/80 bg-blue-50/50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{a.fullPlanTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {previewToken ? a.fullPlanDescWithToken : a.fullPlanDesc}
          </p>
        </div>
        <Link
          href={registerHref}
          className={cn(
            buttonVariants(),
            "h-11 shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-white hover:from-blue-500 hover:to-violet-500"
          )}
        >
          {a.createAccountCta}
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-2 text-center text-xs text-slate-500">
        <p>
          {a.checkedUrl}{" "}
          <span className="text-slate-700">{data.url.final}</span>
        </p>
        <button
          type="button"
          onClick={onCheckAnother}
          className="text-blue-600 transition-colors hover:text-blue-700"
        >
          {a.checkAnother}
        </button>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="marketing-card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </div>
      <p className="text-lg font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
