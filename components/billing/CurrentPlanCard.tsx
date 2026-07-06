import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BillingSubscriptionViewModel } from "@/lib/billing/types";
import { STRIPE_NOT_CONFIGURED_COPY } from "@/lib/copy/trust";

type CurrentPlanCardProps = {
  subscription: BillingSubscriptionViewModel;
  onManageBilling: () => void;
  managing: boolean;
  canManageBilling: boolean;
};

function formatDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function CurrentPlanCard({
  subscription,
  onManageBilling,
  managing,
  canManageBilling,
}: CurrentPlanCardProps) {
  const renewal = formatDate(subscription.currentPeriodEnd);
  const trialEnd = formatDate(subscription.trialEndsAt);

  return (
    <section className="saas-card-hero border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.1] to-blue-500/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 text-violet-200">
            <CreditCard className="size-4" />
            <span className="saas-eyebrow text-violet-300/80">Current plan</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {subscription.planLabel}
          </h2>
          <p className="mt-2 text-sm capitalize text-slate-400">
            Status: {subscription.status.replace(/_/g, " ")}
          </p>
        </div>

        {canManageBilling ? (
          <Button
            type="button"
            variant="outline"
            disabled={managing || !subscription.stripeConfigured}
            onClick={onManageBilling}
            className="min-h-10 rounded-xl border-white/[0.08] bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
          >
            {managing ? "Opening portal…" : "Manage billing"}
          </Button>
        ) : null}
      </div>

      <div className="mt-6 space-y-1.5 border-t border-white/[0.06] pt-5 text-sm leading-relaxed text-slate-300">
        {trialEnd ? <p>Trial ends: {trialEnd}</p> : null}
        {renewal ? (
          <p>
            {subscription.cancelAtPeriodEnd
              ? `Access until: ${renewal} (canceled)`
              : `Renews: ${renewal}`}
          </p>
        ) : null}
        {!subscription.stripeConfigured ? (
          <p className="text-amber-200/90">{STRIPE_NOT_CONFIGURED_COPY}</p>
        ) : null}
      </div>
    </section>
  );
}
