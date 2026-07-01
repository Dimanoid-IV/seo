import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ControlCenterRecommendedAction } from "@/lib/autopilot-control/types";

type RecommendedActionsPanelProps = {
  actions: ControlCenterRecommendedAction[];
  onApiAction?: (action: ControlCenterRecommendedAction) => void;
  actionLoading?: boolean;
  loadingActionId?: string | null;
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "border-red-400/20 bg-red-500/5",
  MEDIUM: "border-amber-400/20 bg-amber-500/5",
  LOW: "border-white/10 bg-white/[0.02]",
};

export function RecommendedActionsPanel({
  actions,
  onApiAction,
  actionLoading,
  loadingActionId,
}: RecommendedActionsPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h3 className="font-semibold text-white">Recommended actions</h3>
      <p className="mt-1 text-xs text-slate-500">What to do next</p>

      <div className="mt-4 space-y-3">
        {actions.length === 0 ? (
          <p className="text-sm text-slate-400">No recommended actions right now.</p>
        ) : (
          actions.map((action) => {
            const isLoading = actionLoading && loadingActionId === action.id;

            return (
              <div
                key={action.id}
                className={`rounded-lg border p-4 ${PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES.LOW}`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold uppercase text-slate-400">
                    {action.priority}
                  </span>
                </div>
                <h4 className="mt-1 font-medium text-white">{action.title}</h4>
                <p className="mt-1 text-sm text-slate-400">{action.description}</p>
                <div className="mt-3">
                  {action.apiAction && onApiAction ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                      className="border-white/10 bg-transparent text-slate-200"
                      onClick={() => onApiAction(action)}
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Run action"
                      )}
                    </Button>
                  ) : action.href ? (
                    <Button
                      render={<Link href={action.href} />}
                      nativeButton={false}
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-transparent text-slate-200"
                    >
                      Open
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
