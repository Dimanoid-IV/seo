"use client";

import Link from "next/link";

import type { AutopilotRecommendedAction } from "@/lib/autopilot/types";
import { localizeFocusAreaPriority } from "@/lib/i18n/saas/focus-area-display";
import {
  localizeActionType,
  localizeRecommendedAction,
} from "@/lib/i18n/saas/plan-display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type RecommendedActionCardProps = {
  action: AutopilotRecommendedAction;
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "text-red-300",
  MEDIUM: "text-amber-300",
  LOW: "text-slate-400",
};

export function RecommendedActionCard({ action }: RecommendedActionCardProps) {
  const { dict } = useSaasTranslations();
  const copy = localizeRecommendedAction(action, dict);
  const typeLabel = localizeActionType(action.type, dict);
  const priorityLabel = localizeFocusAreaPriority(action.priority, dict);

  const content = (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-50">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-medium text-slate-600">
          {typeLabel}
        </span>
        <span className={PRIORITY_STYLES[action.priority] ?? "text-slate-400"}>
          {priorityLabel}
        </span>
      </div>
      <h4 className="font-medium text-slate-900">{copy.title}</h4>
      <p className="text-sm text-slate-400">{copy.description}</p>
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
