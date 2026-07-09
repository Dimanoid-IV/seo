import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { MarketingHomePricingCards } from "@/components/sections/MarketingHomePricingCards";
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
    <section className="marketing-section marketing-section-alt">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          theme="marketing"
          title={preview.title}
          subtitle={preview.subtitle}
        />
        <MarketingHomePricingCards locale={locale} preview={preview} />
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
            {preview.viewAllPlans}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
