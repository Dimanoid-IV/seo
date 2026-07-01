import Link from "next/link";

import type { AutopilotRecommendedAction } from "@/lib/autopilot/types";

type RecommendedActionCardProps = {
  action: AutopilotRecommendedAction;
};

const TYPE_LABELS: Record<string, string> = {
  TASK: "Task",
  ARTICLE: "Article",
  SOCIAL_POST: "Social",
  INTEGRATION: "Integration",
  REVIEW: "Review",
  REPORT: "Report",
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "text-red-300",
  MEDIUM: "text-amber-300",
  LOW: "text-slate-400",
};

export function RecommendedActionCard({ action }: RecommendedActionCardProps) {
  const content = (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-medium text-slate-300">
          {TYPE_LABELS[action.type] ?? action.type}
        </span>
        <span className={PRIORITY_STYLES[action.priority] ?? "text-slate-400"}>
          {action.priority}
        </span>
      </div>
      <h4 className="font-medium text-white">{action.title}</h4>
      <p className="text-sm text-slate-400">{action.description}</p>
    </div>
  );

  if (action.href) {
    return (
      <Link href={action.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
