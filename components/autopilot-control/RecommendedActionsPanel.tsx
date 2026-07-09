"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";
import { Button } from "@/components/ui/button";
import type { ControlCenterRecommendedAction } from "@/lib/autopilot-control/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type RecommendedActionsPanelProps = {
  actions: ControlCenterRecommendedAction[];
  onApiAction?: (action: ControlCenterRecommendedAction) => void;
  actionLoading?: boolean;
  loadingActionId?: string | null;
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "border-amber-500/15 bg-amber-500/[0.04]",
  MEDIUM: "border-blue-500/10 bg-blue-500/[0.03]",
  LOW: "border-slate-200 bg-slate-50",
};

export function RecommendedActionsPanel({
  actions,
  onApiAction,
  actionLoading,
  loadingActionId,
}: RecommendedActionsPanelProps) {
  const { dict } = useSaasTranslations();
  const r = dict.controlCenter.recommended;
  const visibleActions = actions.slice(0, 3);
  const hiddenCount = Math.max(0, actions.length - visibleActions.length);

  function priorityLabel(priority: string): string {
    switch (priority) {
      case "HIGH":
        return r.priorityHigh;
      case "MEDIUM":
        return r.priorityMedium;
      case "LOW":
        return r.priorityLow;
      default:
        return r.priorityLow;
    }
  }

  return (
    <SaasCard variant="muted">
      <SaasSectionHeader title={r.title} subtitle={r.subtitle} />

      <div className="space-y-3">
        {visibleActions.length === 0 ? (
          <p className="text-sm leading-relaxed text-slate-400">{r.emptyNow}</p>
        ) : (
          visibleActions.map((action) => {
            const isLoading = actionLoading && loadingActionId === action.id;

            return (
              <div
                key={action.id}
                className={cn(
                  "rounded-xl border p-5",
                  PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES.LOW
                )}
              >
                <span className="saas-eyebrow">{priorityLabel(action.priority)}</span>
                <h4 className="mt-2 font-medium text-slate-900">{action.title}</h4>
                <p className="mt-2 break-words text-sm leading-relaxed text-slate-400">
                  {action.description}
                </p>
                <div className="mt-4">
                  {action.apiAction && onApiAction ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                      className="min-h-10 w-full rounded-xl border-slate-200 bg-white text-slate-700 sm:w-auto"
                      onClick={() => onApiAction(action)}
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        r.runAction
                      )}
                    </Button>
                  ) : action.href ? (
                    <Button
                      render={<Link href={action.href} />}
                      nativeButton={false}
                      size="sm"
                      variant="outline"
                      className="min-h-10 w-full rounded-xl border-slate-200 bg-white text-slate-700 sm:w-auto"
                    >
                      {r.open}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        {hiddenCount > 0 ? (
          <p className="pt-1 text-xs text-slate-500">
            {r.moreOnDesktop.replace("{count}", String(hiddenCount))}
          </p>
        ) : null}
      </div>
    </SaasCard>
  );
}
