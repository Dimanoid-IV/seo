import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialCard } from "@/components/ui/TestimonialCard";

type TestimonialsSectionProps = {
  dict: Dictionary;
};

export function TestimonialsSection({ dict }: TestimonialsSectionProps) {
  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={dict.testimonials.title}
          subtitle={dict.testimonials.subtitle}
        />
        <div className="grid gap-6 md:grid-cols-3">
          {dict.testimonials.items.map((item) => (
            <TestimonialCard
              key={item.author}
              quote={item.quote}
              author={item.author}
              role={item.role}
              company={item.company}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
