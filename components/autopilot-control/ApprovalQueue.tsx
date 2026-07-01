import Link from "next/link";

import type { ApprovalQueueItem } from "@/lib/autopilot-control/types";

import { ControlEmptyState } from "./ControlEmptyState";

const TYPE_LABELS: Record<string, string> = {
  EMAIL: "Email",
  ARTICLE: "Article",
  SOCIAL_POST: "Social",
  MONTHLY_PLAN: "Monthly plan",
  WORDPRESS_DRAFT: "WordPress",
  TASK: "Task",
  INTEGRATION: "Integration",
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "text-red-300",
  MEDIUM: "text-amber-300",
  LOW: "text-slate-400",
};

type ApprovalQueueItemCardProps = {
  item: ApprovalQueueItem;
};

export function ApprovalQueueItemCard({ item }: ApprovalQueueItemCardProps) {
  const content = (
    <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3 transition-colors hover:bg-black/30">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-medium text-slate-300">
          {TYPE_LABELS[item.type] ?? item.type}
        </span>
        <span className={PRIORITY_STYLES[item.priority] ?? "text-slate-400"}>
          {item.priority}
        </span>
        <span className="text-slate-500 capitalize">{item.status}</span>
      </div>
      <h4 className="mt-2 font-medium text-white">{item.title}</h4>
      {item.description ? (
        <p className="mt-1 text-sm text-slate-400">{item.description}</p>
      ) : null}
      {item.actionLabel ? (
        <p className="mt-2 text-xs font-medium text-blue-400">
          {item.actionLabel} →
        </p>
      ) : null}
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

type ApprovalQueueProps = {
  items: ApprovalQueueItem[];
};

export function ApprovalQueue({ items }: ApprovalQueueProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h3 className="font-semibold text-white">Approval queue</h3>
      <p className="mt-1 text-xs text-slate-500">
        Items waiting for your review or action
      </p>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <ControlEmptyState variant="no-approvals" />
        ) : (
          items.map((item) => (
            <ApprovalQueueItemCard key={`${item.type}-${item.id}`} item={item} />
          ))
        )}
      </div>
    </section>
  );
}
