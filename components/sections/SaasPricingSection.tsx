import Link from "next/link";

import { MarketingPlanCheckoutButton } from "@/components/marketing/MarketingPlanCheckoutButton";
import { MarketingPricingPrice } from "@/components/marketing/MarketingPricingPrice";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { BillingPlanKey } from "@/lib/billing/plans";
import { getSaasDictionary } from "@/lib/i18n/saas";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { cn } from "@/lib/utils";

const PAID_PLAN_KEYS: Array<BillingPlanKey | null> = [
  null,
  "STARTER",
  "PRO",
  "AGENCY",
];

type SaasPricingSectionProps = {
  locale: SaasLocale;
  theme?: "marketing" | "dark";
  hideHeading?: boolean;
};

export function SaasPricingSection({
  locale,
  theme = "marketing",
  hideHeading = false,
}: SaasPricingSectionProps) {
  const pricing = getSaasDictionary(locale).pricing;
  const isMarketing = theme === "marketing";

  return (
    <section className={isMarketing ? "marketing-section" : "py-20 lg:py-28"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!hideHeading ? (
          <SectionHeading
            theme={isMarketing ? "marketing" : "dark"}
            title={pricing.pageTitle}
            subtitle={pricing.pageSubtitle}
          />
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pricing.plans.map((plan, index) => {
            const isPro = index === 2;

            return (
              <div
                key={plan.name}
                className={cn(
                  isMarketing
                    ? index === 0
                      ? "marketing-card relative flex h-full flex-col border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-white"
                      : "marketing-card relative flex h-full flex-col"
                    : "relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6",
                  isPro &&
                    isMarketing &&
                    "border-violet-200/90 ring-1 ring-violet-100"
                )}
              >
                {isPro && isMarketing ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    {pricing.popular}
                  </span>
                ) : null}
                <h3
                  className={
                    isMarketing
                      ? "text-xl font-semibold text-slate-900"
                      : "text-xl font-semibold text-slate-900"
                  }
                >
                  {plan.name}
                </h3>
                <MarketingPricingPrice
                  amount={plan.priceAmount}
                  period={plan.pricePeriod || undefined}
                />
                <p
                  className={
                    isMarketing
                      ? "mt-3 flex-1 text-sm leading-relaxed text-slate-600"
                      : "mt-3 flex-1 text-sm leading-relaxed text-slate-600"
                  }
                >
                  {plan.description}
                </p>
                {PAID_PLAN_KEYS[index] ? (
                  <MarketingPlanCheckoutButton plan={PAID_PLAN_KEYS[index]!} />
                ) : (
                  <div className="mt-6">
                    <ButtonLink
                      locale={locale}
                      href="/register"
                      className={
                        isMarketing
                          ? "inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
                          : "inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 text-sm font-medium text-white"
                      }
                    >
                      {pricing.startFree}
                    </ButtonLink>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p
          className={
            isMarketing
              ? "mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-500"
              : "mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-600"
          }
        >
          {pricing.trustNote}
        </p>
        <p
          className={
            isMarketing
              ? "mx-auto mt-3 max-w-2xl text-center text-xs text-slate-400"
              : "mx-auto mt-3 max-w-2xl text-center text-xs text-slate-500"
          }
        >
          {pricing.checkoutTrustNote}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink
            locale={locale}
            href="/register"
            className={
              isMarketing
                ? "rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-700"
                : "rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 text-white"
            }
          >
            {pricing.startFree}
          </ButtonLink>
          <Link
            href="/login"
            className={
              isMarketing
                ? "inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                : "inline-flex items-center rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            }
          >
            {pricing.createAccount}
          </Link>
        </div>
      </div>
    </section>
  );
}
