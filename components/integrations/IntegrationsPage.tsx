"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Globe, XCircle } from "lucide-react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IntegrationActionSheet } from "@/components/integrations/IntegrationActionSheet";
import { IntegrationGrid } from "@/components/integrations/IntegrationGrid";
import { BrandVoiceCard } from "@/components/integrations/BrandVoiceCard";
import { CustomWebsiteIntegrationPanel } from "@/components/integrations/CustomWebsiteIntegrationPanel";
import { FutureMentionsCard } from "@/components/integrations/FutureMentionsCard";
import { SiteTechHint } from "@/components/integrations/SiteTechHint";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { authFetch } from "@/lib/auth/client-session";
import type {
  IntegrationOverviewItem,
  IntegrationsOverviewData,
} from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

async function fetchIntegrationsOverview(
  loadFailed: string,
  loadNetworkError: string
): Promise<{
  data: IntegrationsOverviewData | null;
  error: string | null;
}> {
  try {
    const response = await authFetch("/api/integrations/overview");

    if (!response.ok) {
      return { data: null, error: loadFailed };
    }

    const body = (await response.json()) as { data: IntegrationsOverviewData };
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: loadNetworkError };
  }
}

function clearOauthQueryParams(): void {
  const url = new URL(window.location.href);
  const keys = [
    "connected",
    "error",
    "gscAutoSelected",
    "gscChooseProperty",
    "gscSynced",
    "gscSyncFailed",
  ];
  if (!keys.some((key) => url.searchParams.has(key))) {
    return;
  }
  for (const key of keys) {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, "", url.pathname + url.search);
}

export function IntegrationsPage() {
  const { dict } = useSaasTranslations();
  const i = dict.integrations;
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
  const gscAutoSelectedParam = searchParams.get("gscAutoSelected");
  const gscChoosePropertyParam = searchParams.get("gscChooseProperty");
  const gscSyncFailedParam = searchParams.get("gscSyncFailed");

  const oauthBanner = useMemo(() => {
    if (connectedParam === "gsc") {
      if (gscAutoSelectedParam === "1") {
        return {
          type: "success" as const,
          message: i.gscAutoSelected,
        };
      }
      if (gscChoosePropertyParam === "1") {
        return {
          type: "success" as const,
          message: i.gscChooseProperty,
        };
      }
      return {
        type: "success" as const,
        message: i.gscConnected,
      };
    }
    if (oauthErrorParam === "gsc_connection_failed") {
      return {
        type: "error" as const,
        message: i.gscConnectionFailed,
      };
    }
    if (oauthErrorParam === "gsc_oauth_not_configured") {
      return {
        type: "error" as const,
        message: i.gscOauthNotConfigured,
      };
    }
    if (gscSyncFailedParam === "1") {
      return {
        type: "error" as const,
        message: i.gscInitialSyncFailed,
      };
    }
    return null;
  }, [
    connectedParam,
    oauthErrorParam,
    gscAutoSelectedParam,
    gscChoosePropertyParam,
    gscSyncFailedParam,
    i,
  ]);

  const gscPickerAutoOpen =
    gscChoosePropertyParam === "1" || gscAutoSelectedParam === "1";

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
    const result = await fetchIntegrationsOverview(i.loadFailed, i.loadNetworkError);
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
      const result = await fetchIntegrationsOverview(i.loadFailed, i.loadNetworkError);
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

    void fetchIntegrationsOverview(i.loadFailed, i.loadNetworkError).then((result) => {
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
    return <PageLoadingState message={i.loading} />;
  }

  if (error || !data) {
    return (
      <PageErrorState
        message={error ?? dict.trust.pageErrorFallback}
        onRetry={() => void refetchIntegrations()}
      />
    );
  }

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader title={i.title} subtitle={i.subtitle} />
      {data.website ? (
        <p className="-mt-4 mb-6 break-all text-xs text-slate-500">{data.website.url}</p>
      ) : (
        <p className="-mt-4 mb-6 text-sm text-amber-300/90">{i.emptyDescription}</p>
      )}

      {data.website?.id ? (
        <div className="mb-6">
          <SiteTechHint websiteId={data.website.id} />
        </div>
      ) : null}

      {data.website?.id ? (
        <div className="mb-8">
          <CustomWebsiteIntegrationPanel websiteId={data.website.id} />
        </div>
      ) : null}

      {data.website?.id ? (
        <BrandVoiceCard websiteId={data.website.id} />
      ) : null}

      {data.website?.id ? (
        <FutureMentionsCard
          title={i.futureMentions.title}
          description={i.futureMentions.description}
          badge={i.futureMentions.badge}
        />
      ) : null}

      {banner ? (
        <div
          className={cn(
            "mb-8 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm",
            banner.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-100"
              : "border-blue-500/15 bg-blue-500/[0.05] text-slate-700"
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
            className="text-slate-600 hover:text-slate-900"
            aria-label={i.close}
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
          title={i.emptyTitle}
          description={i.emptyDescription}
        />
      )}

      <section className="saas-card-muted mt-12">
        <h2 className="text-base font-semibold text-slate-900">{i.benefitsTitle}</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          {i.benefits.map((benefit) => (
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
        websiteUrl={data.website?.url}
        userEmail={user?.email}
        userName={user?.name}
        gscPickerAutoOpen={gscPickerAutoOpen}
        onIntegrationUpdated={() => void refetchIntegrations()}
      />
    </main>
  );
}
