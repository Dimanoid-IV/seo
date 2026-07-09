import Link from "next/link";

import { MarketingPlanCheckoutButton } from "@/components/marketing/MarketingPlanCheckoutButton";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { BillingPlanKey } from "@/lib/billing/plans";
import { getSaasDictionary } from "@/lib/i18n/saas";
import type { SaasLocale } from "@/lib/i18n/saas/locales";

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
          {pricing.plans.map((plan, index) => (
            <div
              key={plan.name}
              className={
                isMarketing
                  ? index === 0
                    ? "marketing-card border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-white"
                    : "marketing-card"
                  : "rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              }
            >
              <h3
                className={
                  isMarketing
                    ? "text-xl font-semibold text-slate-900"
                    : "text-xl font-semibold text-white"
                }
              >
                {plan.name}
              </h3>
              <p
                className={
                  isMarketing
                    ? "mt-2 text-sm leading-relaxed text-slate-600"
                    : "mt-2 text-sm leading-relaxed text-slate-400"
                }
              >
                {plan.description}
              </p>
              {PAID_PLAN_KEYS[index] ? (
                <MarketingPlanCheckoutButton plan={PAID_PLAN_KEYS[index]!} />
              ) : (
                <div className="mt-4">
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
          ))}
        </div>
        <p
          className={
            isMarketing
              ? "mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-500"
              : "mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-400"
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
                : "inline-flex items-center rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5"
            }
          >
            {pricing.createAccount}
          </Link>
        </div>
      </div>
    </section>
  );
}
