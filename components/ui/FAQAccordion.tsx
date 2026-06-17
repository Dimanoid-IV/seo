import type { Locale } from "@/i18n/config";
import type { FAQItem } from "@/data/faq";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FAQAccordionProps = {
  items: FAQItem[];
  locale: Locale;
};

export function FAQAccordion({ items, locale }: FAQAccordionProps) {
  return (
    <Accordion className="w-full gap-3">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="glass-card overflow-hidden rounded-xl border border-white/10 px-6 data-open:border-blue-500/30"
        >
          <AccordionTrigger className="py-5 text-left text-base font-medium text-white hover:no-underline data-open:text-blue-400">
            {item.question[locale]}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-slate-400 leading-relaxed">
            {item.answer[locale]}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
