"use client";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

const STATUS_STYLES: Record<string, string> = {
  draft: "border-slate-400/30 bg-slate-500/10 text-slate-600",
  ready: "border-blue-400/30 bg-blue-500/10 text-blue-200",
  approved: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  sent: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  archived: "border-slate-500/30 bg-slate-600/10 text-slate-400",
};

type EmailApprovalStatusBadgeProps = {
  status: string;
};

export function EmailApprovalStatusBadge({ status }: EmailApprovalStatusBadgeProps) {
  const { dict } = useSaasTranslations();
  const labels = dict.emailApprovals.statuses;
  const label = labels[status as keyof typeof labels] ?? status;
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}

export function EmailApprovalTypeBadge({ type }: { type: string }) {
  const { dict } = useSaasTranslations();
  const labels = dict.emailApprovals.types;
  const normalized = type.toLowerCase() as keyof typeof labels;

  return (
    <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-600">
      {labels[normalized] ?? type}
    </span>
  );
}
