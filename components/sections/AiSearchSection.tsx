import { Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";

type AiSearchSectionProps = {
  dict: Dictionary;
};

export function AiSearchSection({ dict }: AiSearchSectionProps) {
  return (
    <section className="marketing-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="marketing-card mx-auto max-w-4xl bg-gradient-to-br from-blue-50 via-white to-violet-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.45)]">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <p className="marketing-eyebrow">Google + AI search</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {dict.aiSearch.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                {dict.aiSearch.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
