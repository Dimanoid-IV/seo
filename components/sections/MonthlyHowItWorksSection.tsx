import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";

type MonthlyHowItWorksSectionProps = {
  dict: Dictionary;
};

export function MonthlyHowItWorksSection({ dict }: MonthlyHowItWorksSectionProps) {
  const m = dict.monthlyHowItWorks;

  return (
    <section className="marketing-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading theme="marketing" title={m.title} />
        <ol className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          {m.steps.map((step, index) => (
            <li
              key={step}
              className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-sm leading-relaxed text-slate-700"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
                {index + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-slate-500">
          {m.disclaimer}
        </p>
      </div>
    </section>
  );
}
