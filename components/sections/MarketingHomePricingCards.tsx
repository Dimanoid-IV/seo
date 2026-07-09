"use client";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { MarketingPlanCheckoutButton } from "@/components/marketing/MarketingPlanCheckoutButton";
import { MarketingPricingPrice } from "@/components/marketing/MarketingPricingPrice";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { BillingPlanKey } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

const PAID_PLAN_KEYS: Array<BillingPlanKey | null> = [
  null,
  "STARTER",
  "PRO",
  "AGENCY",
];

type MarketingHomePricingCardsProps = {
  locale: Locale;
  preview: Dictionary["pricingPreview"];
};

export function MarketingHomePricingCards({
  locale,
  preview,
}: MarketingHomePricingCardsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {preview.plans.map((plan, index) => {
        const isPro = index === 2;
        const paidPlan = PAID_PLAN_KEYS[index];

        return (
          <div
            key={plan.name}
            className={cn(
              "marketing-card relative flex h-full flex-col",
              index === 0 &&
                "border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-white",
              isPro && "border-violet-200/90 ring-1 ring-violet-100"
            )}
          >
            {isPro ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                {preview.popular}
              </span>
            ) : null}
            <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
            <MarketingPricingPrice
              amount={plan.priceAmount}
              period={plan.pricePeriod || undefined}
            />
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
              {plan.description}
            </p>
            <div className="mt-6">
              {paidPlan ? (
                <MarketingPlanCheckoutButton plan={paidPlan} />
              ) : (
                <ButtonLink
                  locale={locale}
                  href="/register"
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {plan.cta}
                </ButtonLink>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
