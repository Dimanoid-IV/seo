import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { pricingFaqItems } from "@/data/pricing-faq";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

type PricingFAQSectionProps = {
  locale: Locale;
  dict: Dictionary;
};

export function PricingFAQSection({ locale, dict }: PricingFAQSectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={dict.pricingFaq.title}
          subtitle={dict.pricingFaq.subtitle}
        />
        <FAQAccordion items={pricingFaqItems} locale={locale} />
      </div>
    </section>
  );
}
