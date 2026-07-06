"use client";

import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { BillingSubscriptionViewModel } from "@/lib/billing/types";

type CurrentPlanCardProps = {
  subscription: BillingSubscriptionViewModel;
  onManageBilling: () => void;
  managing: boolean;
  canManageBilling: boolean;
};

function formatDate(value: string | undefined, locale: string): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function CurrentPlanCard({
  subscription,
  onManageBilling,
  managing,
  canManageBilling,
}: CurrentPlanCardProps) {
  const { dict, locale } = useSaasTranslations();
  const { billing, trust } = dict;
  const renewal = formatDate(subscription.currentPeriodEnd, locale);
  const trialEnd = formatDate(subscription.trialEndsAt, locale);

  return (
    <section className="saas-card-hero border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.1] to-blue-500/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 text-violet-200">
            <CreditCard className="size-4" />
            <span className="saas-eyebrow text-violet-300/80">{billing.currentPlan}</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {subscription.planLabel}
          </h2>
          <p className="mt-2 text-sm capitalize text-slate-400">
            {subscription.status.replace(/_/g, " ")}
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
            {managing ? `${billing.manageBilling}…` : billing.manageBilling}
          </Button>
        ) : null}
      </div>

      <div className="mt-6 space-y-1.5 border-t border-white/[0.06] pt-5 text-sm leading-relaxed text-slate-300">
        {trialEnd ? (
          <p>
            {billing.trialEnds}: {trialEnd}
          </p>
        ) : null}
        {renewal ? (
          <p>
            {billing.renewsOn}: {renewal}
            {subscription.cancelAtPeriodEnd ? " (canceled)" : ""}
          </p>
        ) : null}
        {!subscription.stripeConfigured ? (
          <p className="text-amber-200/90">{trust.stripeNotConfigured}</p>
        ) : null}
      </div>
    </section>
  );
}
