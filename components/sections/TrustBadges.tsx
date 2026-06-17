import {
  CheckCircle2,
  Globe,
  Calendar,
  Target,
} from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";

const icons = [Globe, Globe, Calendar, Target];

type TrustBadgesProps = {
  dict: Dictionary;
};

export function TrustBadges({ dict }: TrustBadgesProps) {
  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.trust.items.map((item, i) => {
            const Icon = icons[i] ?? CheckCircle2;
            return (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:border-blue-500/20"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-sm font-medium leading-snug text-slate-300">
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
