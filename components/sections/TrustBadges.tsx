import {
  CheckCircle2,
  Shield,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/ru";

const icons = [Shield, XCircle, Sparkles, CheckCircle2];

type TrustBadgesProps = {
  dict: Dictionary;
};

export function TrustBadges({ dict }: TrustBadgesProps) {
  return (
    <section className="border-y border-slate-200/80 bg-white py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dict.trust.items.map((item, i) => {
            const Icon = icons[i] ?? CheckCircle2;
            return (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#c9bfff]/10">
                  <Icon className="size-4 text-[#8169ff]" />
                </div>
                <p className="text-sm font-medium leading-snug text-slate-700">
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
