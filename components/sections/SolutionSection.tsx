import {
  ClipboardList,
  FileText,
  Search,
  TrendingUp,
} from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";

const icons = [Search, ClipboardList, FileText, TrendingUp];

type SolutionSectionProps = {
  dict: Dictionary;
};

export function SolutionSection({ dict }: SolutionSectionProps) {
  return (
    <section className="marketing-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          theme="marketing"
          title={dict.solution.title}
          subtitle={dict.solution.subtitle}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {dict.solution.items.map((item, index) => {
            const Icon = icons[index] ?? Search;
            return (
              <div key={item.title} className="marketing-card">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 ring-1 ring-blue-500/10">
                  <Icon className="size-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
