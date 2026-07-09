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
    <section className="saas-card-hero border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-blue-50/50">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 text-violet-700">
            <CreditCard className="size-4" />
            <span className="saas-eyebrow text-violet-600">{billing.currentPlan}</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {subscription.planLabel}
          </h2>
          <p className="mt-2 text-sm capitalize text-slate-600">
            {subscription.status.replace(/_/g, " ")}
          </p>
        </div>

        {canManageBilling ? (
          <Button
            type="button"
            variant="outline"
            disabled={managing || !subscription.stripeConfigured}
            onClick={onManageBilling}
            className="min-h-10 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            {managing ? `${billing.manageBilling}…` : billing.manageBilling}
          </Button>
        ) : null}
      </div>

      <div className="mt-6 space-y-1.5 border-t border-slate-200 pt-5 text-sm leading-relaxed text-slate-600">
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
          <p className="text-amber-700">{trust.stripeNotConfigured}</p>
        ) : null}
      </div>
    </section>
  );
}
