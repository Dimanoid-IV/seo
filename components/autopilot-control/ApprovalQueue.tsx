"use client";

import Link from "next/link";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";
import type { ApprovalQueueItem } from "@/lib/autopilot-control/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

import { ControlEmptyState } from "./ControlEmptyState";

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "text-amber-300",
  MEDIUM: "text-blue-300/80",
  LOW: "text-slate-400",
};

type ApprovalQueueItemCardProps = {
  item: ApprovalQueueItem;
};

export function ApprovalQueueItemCard({ item }: ApprovalQueueItemCardProps) {
  const { dict } = useSaasTranslations();
  const q = dict.controlCenter.approvalQueue;
  const r = dict.controlCenter.recommended;

  const typeLabels: Record<string, string> = {
    EMAIL: q.types.email,
    ARTICLE: q.types.article,
    SOCIAL_POST: q.types.socialPost,
    MONTHLY_PLAN: q.types.monthlyPlan,
    WORDPRESS_DRAFT: q.types.wordpressDraft,
    TASK: q.types.task,
    INTEGRATION: q.types.integration,
  };

  function priorityLabel(priority: string): string {
    switch (priority) {
      case "HIGH":
        return r.priorityHigh;
      case "MEDIUM":
        return r.priorityMedium;
      case "LOW":
        return r.priorityLow;
      default:
        return priority;
    }
  }

  const content = (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 transition-colors hover:bg-slate-50">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
          {typeLabels[item.type] ?? item.type}
        </span>
        <span className={PRIORITY_STYLES[item.priority] ?? "text-slate-400"}>
          {priorityLabel(item.priority)}
        </span>
        <span className="text-slate-500 capitalize">{item.status}</span>
      </div>
      <h4 className="mt-2.5 font-medium text-slate-900">{item.title}</h4>
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
  const { dict } = useSaasTranslations();
  const q = dict.controlCenter.approvalQueue;

  return (
    <SaasCard variant="muted">
      <SaasSectionHeader title={q.title} subtitle={q.subtitle} />

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
