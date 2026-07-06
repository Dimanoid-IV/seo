import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";
import { Button } from "@/components/ui/button";
import type { ControlCenterIntegration } from "@/lib/autopilot-control/types";
import { cn } from "@/lib/utils";

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
    <SaasCard variant="muted">
      <SaasSectionHeader
        title="Integrations"
        subtitle="Connect when you are ready — RankBoost works without them."
      />

      <ul className="space-y-3">
        {integrations.map((integration) => (
          <li
            key={integration.key}
            className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-white">{integration.name}</p>
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  STATUS_STYLES[integration.status] ?? "text-slate-400"
                )}
              >
                {STATUS_LABELS[integration.status] ?? integration.status}
              </p>
              {integration.description ? (
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
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
        className="mt-5 gap-1 rounded-xl border-white/[0.08] bg-white/[0.03] text-slate-200"
      >
        Manage integrations
        <ArrowRight className="size-3.5" />
      </Button>
    </SaasCard>
  );
}
