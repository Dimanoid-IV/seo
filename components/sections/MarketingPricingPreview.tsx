import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/ButtonLink";

type MarketingPricingPreviewProps = {
  locale: Locale;
  dict: Dictionary;
};

export function MarketingPricingPreview({
  locale,
  dict,
}: MarketingPricingPreviewProps) {
  const preview = dict.pricingPreview;

  return (
    <section className="marketing-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          theme="marketing"
          title={preview.title}
          subtitle={preview.subtitle}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {preview.plans.map((plan, index) => (
            <div
              key={plan.name}
              className={
                index === 0
                  ? "marketing-card border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-white"
                  : "marketing-card"
              }
            >
              <h3 className="text-xl font-semibold text-slate-900">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {plan.description}
              </p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
          {preview.trustNote}
        </p>
        <div className="mt-8 text-center">
          <ButtonLink
            locale={locale}
            href="/pricing"
            variant="outline"
            className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            {dict.nav.pricing}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
