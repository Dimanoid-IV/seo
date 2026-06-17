import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { pricingPlans } from "@/data/pricing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PricingCard } from "@/components/ui/PricingCard";
import { PricingTable } from "@/components/ui/PricingTable";

type PricingSectionProps = {
  locale: Locale;
  dict: Dictionary;
  showComparison?: boolean;
};

export function PricingSection({
  locale,
  dict,
  showComparison = false,
}: PricingSectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={showComparison ? dict.pricing.pageTitle : dict.pricing.title}
          subtitle={
            showComparison ? dict.pricing.pageSubtitle : dict.pricing.subtitle
          }
        />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              locale={locale}
              popularLabel={dict.pricing.popular}
            />
          ))}
        </div>
        {showComparison && (
          <>
            <PricingTable
              locale={locale}
              title={dict.pricing.comparisonTitle}
            />
            <p className="mt-8 text-center text-sm text-slate-500">
              {dict.pricing.customNote}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
