import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { faqItems } from "@/data/faq";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

type FAQSectionProps = {
  locale: Locale;
  dict: Dictionary;
};

export function FAQSection({ locale, dict }: FAQSectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={dict.faq.title} subtitle={dict.faq.subtitle} />
        <FAQAccordion items={faqItems} locale={locale} />
      </div>
    </section>
  );
}
