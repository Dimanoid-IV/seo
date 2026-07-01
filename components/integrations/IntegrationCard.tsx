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

function resolveAction(integration: IntegrationOverviewItem): {
  label: string;
  variant: "primary" | "secondary" | "muted";
} {
  if (integration.comingSoon || !integration.available) {
    return { label: "Coming Soon", variant: "muted" };
  }
  if (integration.connected) {
    return { label: "Manage", variant: "secondary" };
  }
  return { label: "Connect", variant: "primary" };
}

export function IntegrationCard({
  integration,
  onActionClick,
  className,
}: IntegrationCardProps) {
  const visual =
    PROVIDER_ICONS[integration.provider] ?? PROVIDER_ICONS.google_search_console;
  const Icon = visual.icon;
  const action = resolveAction(integration);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]",
        visual.glow,
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-30" />

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
        />
      </div>

      <div className="relative mt-4 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold text-white">{integration.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
          {integration.description}
        </p>

        <div className="mt-4 border-t border-white/5 pt-4">
          {integration.provider === "google_search_console" &&
          integration.connected &&
          !integration.selectedProperty ? (
            <p className="mb-3 text-xs text-amber-400/90">
              Google подключён, но сайт Search Console ещё не выбран.
            </p>
          ) : null}
          {integration.provider === "google_search_console" &&
          integration.connected &&
          integration.selectedProperty ? (
            <p className="mb-3 text-xs text-cyan-300/90">
              Search Console site: {integration.selectedProperty}
            </p>
          ) : null}
          {integration.provider === "google_search_console" &&
          integration.connected &&
          integration.metricsSummary ? (
            <p className="mb-3 text-xs text-slate-400">
              {integration.metricsSummary.clicks.toLocaleString("ru-RU")} кликов
              · {integration.metricsSummary.impressions.toLocaleString("ru-RU")}{" "}
              показов за 28 дней
            </p>
          ) : null}
          {integration.connected && integration.connectedAt ? (
            <p className="mb-3 text-xs text-emerald-400/90">
              Connected at{" "}
              {new Date(integration.connectedAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          ) : null}
          {integration.lastSyncAt ? (
            <p className="mb-3 text-xs text-slate-500">
              Синхронизация: {formatRelativeTime(integration.lastSyncAt)}
            </p>
          ) : null}
          <ConnectionTimeline integration={integration} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onActionClick?.(integration)}
        className={cn(
          "relative mt-5 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition hover:opacity-90",
          action.variant === "primary" &&
            "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500",
          action.variant === "secondary" &&
            "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10",
          action.variant === "muted" &&
            "border border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5"
        )}
      >
        {action.label}
      </button>
    </article>
  );
}
