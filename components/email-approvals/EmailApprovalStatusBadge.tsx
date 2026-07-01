const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  approved: "Approved",
  sent: "Sent",
  archived: "Archived",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "border-slate-400/30 bg-slate-500/10 text-slate-300",
  ready: "border-blue-400/30 bg-blue-500/10 text-blue-200",
  approved: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  sent: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  archived: "border-slate-500/30 bg-slate-600/10 text-slate-400",
};

type EmailApprovalStatusBadgeProps = {
  status: string;
};

export function EmailApprovalStatusBadge({ status }: EmailApprovalStatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status;
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}

const TYPE_LABELS: Record<string, string> = {
  monthly_plan_review: "Monthly plan",
  content_review: "Content",
  social_post_review: "Social posts",
  growth_alert: "Growth alert",
  integration_alert: "Integration",
  general_review: "General review",
};

export function EmailApprovalTypeBadge({ type }: { type: string }) {
  return (
    <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-300">
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}
