import { INTEGRATION_PROVIDER_DETAILS } from "@/lib/integrations/provider-details";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

type IntegrationBenefitListProps = {
  provider: string;
  title?: string;
  className?: string;
};

export function IntegrationBenefitList({
  provider,
  title = "Что даст подключение",
  className,
}: IntegrationBenefitListProps) {
  const details = INTEGRATION_PROVIDER_DETAILS[provider];
  const benefits = details?.benefits ?? [];

  if (benefits.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="space-y-2">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-cyan-400"
              aria-hidden
            />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
