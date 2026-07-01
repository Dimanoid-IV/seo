import Link from "next/link";
import { ArrowRight, CheckCircle2, Plug } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ControlCenterIntegration } from "@/lib/autopilot-control/types";

type IntegrationStatusPanelProps = {
  integrations: ControlCenterIntegration[];
};

const STATUS_LABELS: Record<string, string> = {
  CONNECTED: "Connected",
  MISSING: "Not connected",
  ERROR: "Needs attention",
};

const STATUS_STYLES: Record<string, string> = {
  CONNECTED: "text-emerald-400",
  MISSING: "text-slate-400",
  ERROR: "text-amber-400",
};

export function IntegrationStatusPanel({
  integrations,
}: IntegrationStatusPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2">
        <Plug className="size-4 text-blue-400" />
        <h3 className="font-semibold text-white">Integrations</h3>
      </div>

      <ul className="mt-4 space-y-3">
        {integrations.map((integration) => (
          <li
            key={integration.key}
            className="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-4 py-3"
          >
            <div>
              <p className="font-medium text-white">{integration.name}</p>
              <p
                className={`text-xs font-medium ${STATUS_STYLES[integration.status] ?? "text-slate-400"}`}
              >
                {STATUS_LABELS[integration.status] ?? integration.status}
              </p>
              {integration.description ? (
                <p className="mt-1 text-xs text-slate-500">
                  {integration.description}
                </p>
              ) : null}
            </div>
            {integration.status === "CONNECTED" ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            ) : null}
          </li>
        ))}
      </ul>

      <Button
        render={<Link href="/app/integrations" />}
        nativeButton={false}
        variant="outline"
        size="sm"
        className="mt-4 gap-1 border-white/10 bg-transparent text-slate-200"
      >
        Open integrations
        <ArrowRight className="size-3.5" />
      </Button>
    </section>
  );
}
