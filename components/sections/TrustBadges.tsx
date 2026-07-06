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
    <section className="border-y border-slate-200/80 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dict.trust.items.map((item, i) => {
            const Icon = icons[i] ?? CheckCircle2;
            return (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Icon className="size-4 text-blue-600" />
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
