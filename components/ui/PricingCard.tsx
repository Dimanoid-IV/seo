import { Check } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { PricingPlan } from "@/data/pricing";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";
import { getContactPath } from "@/lib/contact-links";

type PricingCardProps = {
  plan: PricingPlan;
  locale: Locale;
  popularLabel: string;
};

export function PricingCard({ plan, locale, popularLabel }: PricingCardProps) {
  return (
    <div
      className={cn(
        "glass-card relative flex flex-col p-8 transition-all duration-300",
        plan.highlighted
          ? "border-blue-500/40 glow-blue scale-[1.02]"
          : "hover:border-white/20"
      )}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-1 text-xs font-semibold text-white">
          {popularLabel}
        </span>
      )}
      <h3 className="text-xl font-bold text-white">{plan.name[locale]}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold gradient-text">
          {plan.price[locale]}
        </span>
        {plan.period[locale] && (
          <span className="text-slate-400">{plan.period[locale]}</span>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-400">{plan.description[locale]}</p>
      <ul className="my-8 flex-1 space-y-3">
        {plan.features[locale].map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            {feature}
          </li>
        ))}
      </ul>
      <ButtonLink
        locale={locale}
        href={getContactPath({ plan: plan.id, source: "pricing" })}
        className={cn(
          "w-full",
          plan.highlighted
            ? "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500"
            : "bg-white/10 hover:bg-white/15"
        )}
      >
        {plan.cta[locale]}
      </ButtonLink>
    </div>
  );
}
