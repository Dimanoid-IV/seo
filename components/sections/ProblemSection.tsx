import { AlertCircle } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";

type ProblemSectionProps = {
  dict: Dictionary;
};

export function ProblemSection({ dict }: ProblemSectionProps) {
  return (
    <section className="marketing-section marketing-section-alt">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          theme="marketing"
          title={dict.problem.title}
          subtitle={dict.problem.subtitle}
        />
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {dict.problem.items.map((item) => (
            <div key={item} className="marketing-card-soft flex gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-500/90" />
              <p className="text-sm leading-relaxed text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
