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
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Service } from "@/data/services";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";

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
  Sparkles,
};

type ServiceCardProps = {
  service: Service;
  locale: Locale;
  ctaLabel: string;
  whatsIncluded?: string;
  detailed?: boolean;
  theme?: "dark" | "marketing";
};

export function ServiceCard({
  service,
  locale,
  ctaLabel,
  whatsIncluded,
  detailed = false,
  theme = "dark",
}: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Search;
  const isMarketing = theme === "marketing";

  return (
    <div
      className={cn(
        "group flex flex-col p-6 transition-all duration-300",
        isMarketing
          ? "marketing-card hover:border-blue-300 hover:shadow-[0_12px_40px_-16px_rgba(59,130,246,0.2)]"
          : "glass-card hover:border-blue-500/30 hover:glow-sm",
        detailed && "h-full"
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 ring-1 ring-blue-500/20">
        <Icon className={cn("h-6 w-6", isMarketing ? "text-blue-600" : "text-blue-400")} />
      </div>
      <h3
        className={cn(
          "mb-2 text-xl font-semibold",
          isMarketing ? "text-slate-900" : "text-white"
        )}
      >
        {service.title[locale]}
      </h3>
      <p
        className={cn(
          "mb-4 text-sm leading-relaxed",
          isMarketing ? "text-slate-600" : "text-slate-400"
        )}
      >
        {service.description[locale]}
      </p>
      {detailed && whatsIncluded && (
        <p
          className={cn(
            "mb-3 text-xs font-semibold uppercase tracking-wider",
            isMarketing ? "text-slate-500" : "text-slate-500"
          )}
        >
          {whatsIncluded}
        </p>
      )}
      <ul className={cn("mb-6 space-y-2", detailed && "flex-1")}>
        {service.features[locale].map((feature) => (
          <li
            key={feature}
            className={cn(
              "flex items-start gap-2 text-sm",
              isMarketing ? "text-slate-600" : "text-slate-400"
            )}
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            {feature}
          </li>
        ))}
      </ul>
      <ButtonLink
        locale={locale}
        href="/register"
        className={cn(
          "mt-auto w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500",
          !detailed && "w-auto self-start px-4"
        )}
        size={detailed ? "default" : "sm"}
      >
        {ctaLabel}
      </ButtonLink>
    </div>
  );
}
