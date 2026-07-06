import Link from "next/link";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";
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
  HIGH: "text-amber-300",
  MEDIUM: "text-blue-300/80",
  LOW: "text-slate-400",
};

type ApprovalQueueItemCardProps = {
  item: ApprovalQueueItem;
};

export function ApprovalQueueItemCard({ item }: ApprovalQueueItemCardProps) {
  const content = (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-white/[0.06] px-2.5 py-0.5 font-medium text-slate-300">
          {TYPE_LABELS[item.type] ?? item.type}
        </span>
        <span className={PRIORITY_STYLES[item.priority] ?? "text-slate-400"}>
          {item.priority}
        </span>
        <span className="text-slate-500 capitalize">{item.status}</span>
      </div>
      <h4 className="mt-2.5 font-medium text-white">{item.title}</h4>
      {item.description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
          {item.description}
        </p>
      ) : null}
      {item.actionLabel ? (
        <p className="mt-2.5 text-xs font-medium text-blue-300">
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
    <SaasCard variant="muted">
      <SaasSectionHeader
        title="Approval queue"
        subtitle="Items waiting for your review — nothing sends automatically."
      />

      <div className="space-y-3">
        {items.length === 0 ? (
          <ControlEmptyState variant="no-approvals" />
        ) : (
          items.map((item) => (
            <ApprovalQueueItemCard key={`${item.type}-${item.id}`} item={item} />
          ))
        )}
      </div>
    </SaasCard>
  );
}
