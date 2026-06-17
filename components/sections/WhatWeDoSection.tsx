import {
  Search,
  Settings,
  Hash,
  FileText,
  MapPin,
  Link2,
  Layout,
  TrendingUp,
} from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";

const icons = [Search, Settings, Hash, FileText, MapPin, Link2, Layout, TrendingUp];

type WhatWeDoSectionProps = {
  dict: Dictionary;
};

export function WhatWeDoSection({ dict }: WhatWeDoSectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={dict.whatWeDo.title}
          subtitle={dict.whatWeDo.subtitle}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dict.whatWeDo.items.map((item, i) => {
            const Icon = icons[i] ?? Search;
            return (
              <div
                key={item}
                className="group glass-card flex items-start gap-3 p-5 transition-all hover:border-blue-500/30 hover:glow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 ring-1 ring-blue-500/20 transition-all group-hover:ring-blue-500/40">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-sm font-medium leading-snug text-slate-200">
                  {item}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
