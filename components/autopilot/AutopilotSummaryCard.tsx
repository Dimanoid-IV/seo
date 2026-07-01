import type { MonthlyAutopilotPlanViewModel } from "@/lib/autopilot/types";

type AutopilotSummaryCardProps = {
  plan: MonthlyAutopilotPlanViewModel;
  monthLabel: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ready: "Ready for review",
  approved: "Approved",
  archived: "Archived",
};

export function AutopilotSummaryCard({ plan, monthLabel }: AutopilotSummaryCardProps) {
  const statusLabel = STATUS_LABELS[plan.status] ?? plan.status;

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-blue-500/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
            {monthLabel}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">{plan.title}</h2>
        </div>
        <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
          {statusLabel}
        </span>
      </div>
      {plan.summary ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{plan.summary}</p>
      ) : null}
      <p className="mt-4 text-xs text-slate-500">
        Created {new Date(plan.createdAt).toLocaleDateString()} · Updated{" "}
        {new Date(plan.updatedAt).toLocaleDateString()}
      </p>
    </section>
  );
}
