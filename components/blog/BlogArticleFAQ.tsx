import type { BlogFAQItem } from "@/data/blog/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type BlogArticleFAQProps = {
  title: string;
  items: BlogFAQItem[];
};

export function BlogArticleFAQ({ title, items }: BlogArticleFAQProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-12 border-t border-white/10 pt-12">
      <h2 className="mb-6 text-2xl font-bold text-white">{title}</h2>
      <Accordion className="gap-3">
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="glass-card rounded-xl border border-white/10 px-6"
          >
            <AccordionTrigger className="py-4 text-left text-base font-medium text-white hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-slate-400 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
