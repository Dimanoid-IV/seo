import {
  Settings,
  MapPin,
  Search,
  FileText,
  ShoppingCart,
  TrendingUp,
  Globe,
  Layout,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Service } from "@/data/services";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";
import { getContactPath } from "@/lib/contact-links";

const iconMap: Record<string, LucideIcon> = {
  Settings,
  MapPin,
  Search,
  FileText,
  ShoppingCart,
  TrendingUp,
  Globe,
  Layout,
  Rocket,
};

type ServiceCardProps = {
  service: Service;
  locale: Locale;
  ctaLabel: string;
  whatsIncluded?: string;
  detailed?: boolean;
};

export function ServiceCard({
  service,
  locale,
  ctaLabel,
  whatsIncluded,
  detailed = false,
}: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Search;

  return (
    <div
      className={cn(
        "group glass-card flex flex-col p-6 transition-all duration-300 hover:border-blue-500/30 hover:glow-sm",
        detailed && "h-full"
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 ring-1 ring-blue-500/20">
        <Icon className="h-6 w-6 text-blue-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">
        {service.title[locale]}
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-slate-400">
        {service.description[locale]}
      </p>
      {detailed && whatsIncluded && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {whatsIncluded}
        </p>
      )}
      <ul className={cn("mb-6 space-y-2", detailed && "flex-1")}>
        {service.features[locale].map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-slate-400"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            {feature}
          </li>
        ))}
      </ul>
      <ButtonLink
        locale={locale}
        href={getContactPath({ service: service.id, source: "services" })}
        className={cn(
          "mt-auto w-full bg-gradient-to-r from-blue-600/80 to-violet-600/80 hover:from-blue-600 hover:to-violet-600",
          !detailed && "w-auto self-start px-4"
        )}
        size={detailed ? "default" : "sm"}
      >
        {ctaLabel}
      </ButtonLink>
    </div>
  );
}
