import { Check } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";

type ForWhomSectionProps = {
  dict: Dictionary;
};

export function ForWhomSection({ dict }: ForWhomSectionProps) {
  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <SectionHeading
            title={dict.forWhom.title}
            subtitle={dict.forWhom.subtitle}
            align="left"
            className="mb-0"
          />
          <ul className="space-y-4">
            {dict.forWhom.items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                  <Check className="h-3 w-3 text-cyan-400" />
                </div>
                <span className="text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
