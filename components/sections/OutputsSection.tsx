import { CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";

type OutputsSectionProps = {
  dict: Dictionary;
};

export function OutputsSection({ dict }: OutputsSectionProps) {
  return (
    <section className="marketing-section marketing-section-alt">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          theme="marketing"
          title={dict.outputs.title}
          subtitle={dict.outputs.subtitle}
        />
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dict.outputs.items.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3.5"
            >
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">{item}</span>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
          {dict.outputs.trustNote}
        </p>
      </div>
    </section>
  );
}
