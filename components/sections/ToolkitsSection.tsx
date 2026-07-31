import {
  BarChart3,
  CalendarDays,
  FileText,
  Globe2,
  Search,
  UploadCloud,
} from "lucide-react";

import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";

const icons = [Search, BarChart3, CalendarDays, FileText, UploadCloud, Globe2];

type ToolkitsSectionProps = {
  dict: Dictionary;
};

export function ToolkitsSection({ dict }: ToolkitsSectionProps) {
  return (
    <section className="marketing-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          theme="marketing"
          eyebrow={dict.toolkits.eyebrow}
          title={dict.toolkits.title}
          subtitle={dict.toolkits.subtitle}
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {dict.toolkits.items.map((item, index) => {
            const Icon = icons[index] ?? Search;

            return (
              <article
                key={item.title}
                className="rounded-3xl border border-[#d7ddf0] bg-white p-6 shadow-[0_20px_60px_-44px_rgba(24,24,24,0.5)]"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#c9bfff]/25 text-[#8169ff]">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#181818]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#555555]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
