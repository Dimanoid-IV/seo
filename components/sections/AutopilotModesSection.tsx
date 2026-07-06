import { CheckCircle2, PauseCircle, Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";

type AutopilotModesSectionProps = {
  dict: Dictionary;
};

export function AutopilotModesSection({ dict }: AutopilotModesSectionProps) {
  const m = dict.autopilotModes;

  return (
    <section className="marketing-section marketing-section-alt">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading theme="marketing" title={m.title} subtitle={m.subtitle} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="marketing-card border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {m.reviewMode.badge}
            </span>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">{m.reviewMode.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{m.reviewMode.description}</p>
            <div className="mt-5 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{m.reviewMode.badge}</span>
            </div>
          </div>
          <div className="marketing-card border-violet-200/80 bg-gradient-to-br from-violet-50/60 to-white">
            <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
              {m.autoPublishMode.badge}
            </span>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">{m.autoPublishMode.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{m.autoPublishMode.description}</p>
            <div className="mt-5 flex items-center gap-2 text-sm text-violet-700">
              <PauseCircle className="size-4 shrink-0" />
              <span>{m.autoPublishMode.badge}</span>
            </div>
          </div>
        </div>
        <ul className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {m.safeguards.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-500" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-slate-500">
          {m.note}
        </p>
      </div>
    </section>
  );
}
