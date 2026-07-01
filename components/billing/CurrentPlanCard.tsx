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
    <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-200">
            <CreditCard className="size-4" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Current plan
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {subscription.planLabel}
          </h2>
          <p className="mt-1 text-sm capitalize text-slate-400">
            Status: {subscription.status.replace(/_/g, " ")}
          </p>
        </div>

        {canManageBilling ? (
          <Button
            type="button"
            variant="outline"
            disabled={managing || !subscription.stripeConfigured}
            onClick={onManageBilling}
            className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            {managing ? "Opening portal…" : "Manage billing"}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 space-y-1 text-sm text-slate-300">
        {trialEnd ? <p>Trial ends: {trialEnd}</p> : null}
        {renewal ? (
          <p>
            {subscription.cancelAtPeriodEnd
              ? `Access until: ${renewal} (canceled)`
              : `Renews: ${renewal}`}
          </p>
        ) : null}
        {!subscription.stripeConfigured ? (
          <p className="text-amber-300">{STRIPE_NOT_CONFIGURED_COPY}</p>
        ) : null}
      </div>
    </section>
  );
}
