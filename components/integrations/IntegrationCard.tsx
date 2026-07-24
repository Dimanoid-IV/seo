"use client";

import {
  BarChart3,
  Cloud,
  Globe,
  Mail,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import { ConnectionTimeline } from "@/components/integrations/ConnectionTimeline";
import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";
import { formatRelativeTime } from "@/lib/dashboard/display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { IntegrationOverviewItem } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

type IntegrationCardProps = {
  integration: IntegrationOverviewItem;
  onActionClick?: (integration: IntegrationOverviewItem) => void;
  className?: string;
};

const PROVIDER_ICONS: Record<
  string,
  { icon: typeof Search; accent: string; glow: string }
> = {
  google_search_console: {
    icon: Search,
    accent: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/20",
  },
  google_analytics: {
    icon: BarChart3,
    accent: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/20",
  },
  google_business_profile: {
    icon: MapPin,
    accent: "from-emerald-500 to-green-500",
    glow: "shadow-emerald-500/20",
  },
  wordpress: {
    icon: Globe,
    accent: "from-sky-500 to-indigo-500",
    glow: "shadow-sky-500/20",
  },
  cloudflare: {
    icon: Cloud,
    accent: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
  },
  resend: {
    icon: Mail,
    accent: "from-violet-500 to-fuchsia-500",
    glow: "shadow-violet-500/20",
  },
  hermes_ai: {
    icon: Sparkles,
    accent: "from-purple-500 to-pink-500",
    glow: "shadow-purple-500/20",
  },
};

function resolveAction(
  integration: IntegrationOverviewItem,
  labels: {
    connect: string;
    connectGsc: string;
    selectGscProperty: string;
    manage: string;
    comingSoon: string;
    platformManaged: string;
    notConfigured: string;
  }
): {
  label: string;
  variant: "primary" | "secondary" | "muted";
  disabled?: boolean;
} {
  if (integration.provider === "hermes_ai") {
    if (integration.hermesConfigured) {
      return { label: labels.platformManaged, variant: "secondary", disabled: true };
    }
    return { label: labels.notConfigured, variant: "muted", disabled: true };
  }

  if (integration.comingSoon || !integration.available) {
    return { label: labels.comingSoon, variant: "muted" };
  }
  if (integration.provider === "google_search_console") {
    if (integration.gscState === "GOOGLE_CONNECTED_NO_PROPERTY") {
      return { label: labels.selectGscProperty, variant: "primary" };
    }
    if (integration.connected) {
      return { label: labels.manage, variant: "secondary" };
    }
    return { label: labels.connectGsc, variant: "primary" };
  }
  if (integration.connected) {
    return { label: labels.manage, variant: "secondary" };
  }
  return { label: labels.connect, variant: "primary" };
}

export function IntegrationCard({
  integration,
  onActionClick,
  className,
}: IntegrationCardProps) {
  const { dict, locale } = useSaasTranslations();
  const i = dict.integrations;
  const visual =
    PROVIDER_ICONS[integration.provider] ?? PROVIDER_ICONS.google_search_console;
  const Icon = visual.icon;
  const action = resolveAction(integration, {
    connect: i.connect,
    connectGsc: i.connectGscButton,
    selectGscProperty: i.gscSelectPropertyCta,
    manage: i.manage,
    comingSoon: i.comingSoon,
    platformManaged: i.hermesPlatformManaged,
    notConfigured: i.hermesNotConfigured,
  });
  const gscAwaitingProperty =
    integration.provider === "google_search_console" &&
    integration.gscState === "GOOGLE_CONNECTED_NO_PROPERTY";
  const dateLocale = locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-US";
  const numberLocale = dateLocale;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-200 hover:bg-slate-50 sm:p-7",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br from-blue-500/10 to-violet-500/10 opacity-60 blur-2xl transition-opacity group-hover:opacity-80" />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
            visual.accent
          )}
        >
          <Icon className="size-6 text-white" aria-hidden />
        </div>
        <IntegrationStatusBadge
          status={integration.status}
          comingSoon={integration.comingSoon}
          label={gscAwaitingProperty ? i.gscPartialBadge : undefined}
        />
      </div>

      <div className="relative mt-4 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold text-slate-900">{integration.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
          {integration.description}
        </p>

        <div className="mt-4 border-t border-slate-200 pt-4">
          {gscAwaitingProperty ? (
            <p className="mb-3 text-xs text-amber-700">
              {i.gscSiteNotSelected}
            </p>
          ) : null}
          {integration.provider === "google_search_console" &&
          integration.connected &&
          integration.selectedProperty ? (
            <p className="mb-3 text-xs text-cyan-700">
              {i.searchConsoleSite} {integration.selectedProperty}
            </p>
          ) : null}
          {integration.provider === "google_search_console" &&
          integration.connected &&
          integration.metricsSummary ? (
            <p className="mb-3 text-xs text-slate-600">
              {integration.metricsSummary.clicks.toLocaleString(numberLocale)}{" "}
              {i.clicks} ·{" "}
              {integration.metricsSummary.impressions.toLocaleString(numberLocale)}{" "}
              {i.impressions} {i.last28Days}
            </p>
          ) : null}
          {integration.connected && integration.connectedAt ? (
            <p className="mb-3 text-xs text-emerald-700">
              {i.connectedSince}{" "}
              {new Date(integration.connectedAt).toLocaleDateString(dateLocale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          ) : null}
          {integration.lastSyncAt ? (
            <p className="mb-3 text-xs text-slate-500">
              {i.sync}: {formatRelativeTime(integration.lastSyncAt)}
            </p>
          ) : null}
          <ConnectionTimeline integration={integration} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onActionClick?.(integration)}
        disabled={action.disabled}
        className={cn(
          "relative mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition",
          action.variant === "primary" &&
            "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_6px_20px_-6px_rgba(59,130,246,0.4)] hover:from-blue-500 hover:to-violet-500",
          action.variant === "secondary" &&
            "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
          action.variant === "muted" &&
            "border border-slate-200 bg-slate-50 text-slate-500",
          action.disabled && "cursor-default opacity-80 hover:bg-inherit"
        )}
      >
        {action.label}
      </button>
    </article>
  );
}
