"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Globe, XCircle } from "lucide-react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IntegrationActionSheet } from "@/components/integrations/IntegrationActionSheet";
import { IntegrationGrid } from "@/components/integrations/IntegrationGrid";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";
import { authFetch } from "@/lib/auth/client-session";
import type {
  IntegrationOverviewItem,
  IntegrationsOverviewData,
} from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

async function fetchIntegrationsOverview(): Promise<{
  data: IntegrationsOverviewData | null;
  error: string | null;
}> {
  try {
    const response = await authFetch("/api/integrations/overview");

    if (!response.ok) {
      return { data: null, error: "Не удалось загрузить интеграции" };
    }

    const body = (await response.json()) as { data: IntegrationsOverviewData };
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: "Сетевая ошибка при загрузке интеграций" };
  }
}

const BENEFITS = [
  "Unlock real Google Search Console data and search opportunities",
  "Create WordPress drafts for your review (you decide when to publish)",
  "Prepare monthly growth summaries and review emails",
  "Power Autopilot plans with live website and search data",
];

function clearOauthQueryParams(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("connected") && !url.searchParams.has("error")) {
    return;
  }
  url.searchParams.delete("connected");
  url.searchParams.delete("error");
  window.history.replaceState({}, "", url.pathname + url.search);
}

export function IntegrationsPage() {
  const { user } = useAuthSession();
  const searchParams = useSearchParams();
  const [data, setData] = useState<IntegrationsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<IntegrationOverviewItem | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const gscSuccessHandledRef = useRef(false);

  const connectedParam = searchParams.get("connected");
  const oauthErrorParam = searchParams.get("error");

  const oauthBanner = useMemo(() => {
    if (connectedParam === "gsc") {
      return {
        type: "success" as const,
        message: "Google Search Console connected successfully.",
      };
    }
    if (oauthErrorParam === "gsc_connection_failed") {
      return {
        type: "error" as const,
        message:
          "Google Search Console is not ready to connect yet. You can continue using RankBoost without it.",
      };
    }
    return null;
  }, [connectedParam, oauthErrorParam]);

  const banner = bannerDismissed ? null : oauthBanner;

  function handleDismissBanner() {
    setBannerDismissed(true);
    clearOauthQueryParams();
  }

  function handleIntegrationAction(integration: IntegrationOverviewItem) {
    setSelectedIntegration(integration);
    setSheetOpen(true);
  }

  async function refetchIntegrations() {
    const result = await fetchIntegrationsOverview();
    setData(result.data);
    setError(result.error);

    if (selectedIntegration && result.data) {
      const updated = result.data.integrations.find(
        (item) => item.provider === selectedIntegration.provider
      );
      if (updated) {
        setSelectedIntegration(updated);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await fetchIntegrationsOverview();
      if (cancelled) {
        return;
      }
      setData(result.data);
      setError(result.error);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (connectedParam !== "gsc" || gscSuccessHandledRef.current) {
      return;
    }

    gscSuccessHandledRef.current = true;
    setBannerDismissed(false);

    void fetchIntegrationsOverview().then((result) => {
      setData(result.data);
      const gsc = result.data?.integrations.find(
        (item) => item.provider === "google_search_console"
      );
      if (gsc) {
        setSelectedIntegration(gsc);
        setSheetOpen(true);
      }
    });
  }, [connectedParam]);

  if (loading) {
    return <PageLoadingState message="Loading integrations…" />;
  }

  if (error || !data) {
    return (
      <PageErrorState
        message={error ?? PAGE_ERROR_FALLBACK}
        onRetry={() => void refetchIntegrations()}
      />
    );
  }

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        title="Integrations"
        subtitle="Connect data sources and publishing tools to unlock better growth actions."
      />
      {data.website ? (
        <p className="-mt-4 mb-6 break-all text-xs text-slate-500">{data.website.url}</p>
      ) : (
        <p className="-mt-4 mb-6 text-sm text-amber-300/90">
          Add a website to connect integrations to a specific project.
        </p>
      )}

      {banner ? (
        <div
          className={cn(
            "mb-8 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm",
            banner.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-100"
              : "border-blue-500/15 bg-blue-500/[0.05] text-slate-200"
          )}
        >
          {banner.type === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
          )}
          <p className="flex-1">{banner.message}</p>
          <button
            type="button"
            onClick={handleDismissBanner}
            className="text-slate-400 hover:text-white"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      ) : null}

      {data.integrations.length > 0 ? (
        <IntegrationGrid
          integrations={data.integrations}
          onIntegrationAction={handleIntegrationAction}
        />
      ) : (
        <EmptyState
          icon={Globe}
          title="Integrations are loading"
          description="The integration catalog will appear here once configuration is available."
        />
      )}

      <section className="saas-card-muted mt-12">
        <h2 className="text-base font-semibold text-white">
          Why connect integrations?
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-400" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <IntegrationActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        integration={selectedIntegration}
        websiteId={data.website?.id}
        userEmail={user?.email}
        onIntegrationUpdated={() => void refetchIntegrations()}
      />
    </main>
  );
}
