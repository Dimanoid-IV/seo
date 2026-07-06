import { ShieldCheck } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";

type ControlSectionProps = {
  dict: Dictionary;
};

export function ControlSection({ dict }: ControlSectionProps) {
  return (
    <section className="marketing-section marketing-section-alt">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading theme="marketing" title={dict.control.title} />
        <div className="mx-auto grid max-w-3xl gap-4">
          {dict.control.items.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-5 py-4"
            >
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <p className="text-sm leading-relaxed text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
