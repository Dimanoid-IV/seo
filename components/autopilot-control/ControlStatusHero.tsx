import Link from "next/link";
import { ArrowRight, Plug, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ControlCenterStatus } from "@/lib/autopilot-control/types";

type ControlStatusHeroProps = {
  status: ControlCenterStatus;
  hasWebsite: boolean;
  onGeneratePlan?: () => void;
  generating?: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  NEEDS_REVIEW: "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5",
  READY: "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5",
  NEEDS_SETUP: "border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-violet-500/5",
  NO_DATA: "border-slate-500/30 bg-gradient-to-br from-slate-500/10 to-slate-600/5",
};

export function ControlStatusHero({
  status,
  hasWebsite,
  onGeneratePlan,
  generating,
}: ControlStatusHeroProps) {
  const style =
    STATUS_STYLES[status.overall] ?? STATUS_STYLES.NEEDS_SETUP;

  return (
    <section className={`rounded-2xl border p-6 ${style}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-violet-300">
              {status.label}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            {status.description}
          </h2>
        </div>

        {hasWebsite ? (
          <div className="flex flex-wrap gap-2">
            {onGeneratePlan ? (
              <Button
                type="button"
                size="sm"
                disabled={generating}
                onClick={onGeneratePlan}
                className="gap-1"
              >
                Generate monthly plan
              </Button>
            ) : null}
            <Button
              render={<Link href="/app/timeline" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1 border-white/10 bg-transparent text-slate-200"
            >
              Open Timeline
              <ArrowRight className="size-3.5" />
            </Button>
            <Button
              render={<Link href="/app/integrations" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1 border-white/10 bg-transparent text-slate-200"
            >
              <Plug className="size-3.5" />
              Integrations
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
