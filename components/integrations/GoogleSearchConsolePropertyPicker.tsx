"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { GscSyncButton } from "@/components/integrations/GoogleSearchConsoleDashboardCard";
import { GscMetricsSummaryDisplay } from "@/components/integrations/GscMetricsSummary";
import { GscInsightsList } from "@/components/integrations/GscInsightsList";
import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { GSC_WEB_URL } from "@/lib/integrations/gsc-domain-match";
import type {
  GscSelectSiteResponse,
  GscSitesResponse,
  GscSyncResponse,
  SearchConsoleSite,
} from "@/lib/integrations/gsc-types";
import { generateGscInsights } from "@/lib/integrations/gsc-insights";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type GoogleSearchConsolePropertyPickerProps = {
  selectedSiteUrl?: string | null;
  websiteId?: string | null;
  onSiteSelected: (siteUrl: string) => void;
  onIntegrationUpdated?: () => void;
  onContinueWithoutGsc?: () => void;
  className?: string;
};

function GscPropertyActions({
  onRetry,
  onContinueWithoutGsc,
  retryLabel,
  continueLabel,
  openSearchConsoleLabel,
}: {
  onRetry: () => void;
  onContinueWithoutGsc?: () => void;
  retryLabel: string;
  continueLabel: string;
  openSearchConsoleLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-slate-200 bg-white text-slate-700"
        render={
          <a href={GSC_WEB_URL} target="_blank" rel="noopener noreferrer" />
        }
        nativeButton={false}
      >
        <ExternalLink className="size-3.5" />
        {openSearchConsoleLabel}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-slate-200 bg-white text-slate-700"
        onClick={onRetry}
      >
        {retryLabel}
      </Button>
      {onContinueWithoutGsc ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-slate-500 hover:text-slate-700"
          onClick={onContinueWithoutGsc}
        >
          {continueLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function GoogleSearchConsolePropertyPicker({
  selectedSiteUrl,
  websiteId,
  onSiteSelected,
  onIntegrationUpdated,
  onContinueWithoutGsc,
  className,
}: GoogleSearchConsolePropertyPickerProps) {
  const { dict } = useSaasTranslations();
  const p = dict.integrations.gscPropertyPicker;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submittingSiteUrl, setSubmittingSiteUrl] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [sites, setSites] = useState<SearchConsoleSite[]>([]);
  const [websiteDomain, setWebsiteDomain] = useState<string | null>(null);
  const [hasMatchingProperty, setHasMatchingProperty] = useState<boolean | null>(
    null
  );
  const [showOtherProperties, setShowOtherProperties] = useState(false);
  const [loadedSelectedSiteUrl, setLoadedSelectedSiteUrl] = useState<
    string | null
  >(selectedSiteUrl ?? null);
  const [successSiteUrl, setSuccessSiteUrl] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncSummary, setSyncSummary] = useState<
    GscSyncResponse["data"]["summary"] | null
  >(null);
  const [syncTasksCreated, setSyncTasksCreated] = useState<number | null>(null);

  async function loadSites() {
    setLoading(true);
    setError(null);
    setSuccessSiteUrl(null);
    setShowOtherProperties(false);

    try {
      const response = await authFetch(
        "/api/integrations/google/search-console/sites"
      );

      if (!response.ok) {
        const message = await parseApiErrorMessage(response, p.loadFailed);
        setError(message);
        return;
      }

      const body = (await response.json()) as GscSitesResponse;
      setSites(body.data.sites);
      setLoadedSelectedSiteUrl(body.data.selectedSiteUrl);
      setWebsiteDomain(body.data.websiteDomain);
      setHasMatchingProperty(body.data.hasMatchingProperty);
    } catch {
      setError(p.loadNetworkError);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const response = await authFetch(
        "/api/integrations/google/search-console/sync",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(websiteId ? { websiteId } : {}),
        }
      );

      if (!response.ok) {
        const message = await parseApiErrorMessage(
          response,
          dict.integrations.gscSyncFailed
        );
        setSyncError(message);
        return;
      }

      const body = (await response.json()) as GscSyncResponse;
      setSyncSummary(body.data.summary);
      setSyncSuccess(true);
      setSyncTasksCreated(
        body.data.tasksCreated ?? body.data.tasksCreatedLastSync ?? 0
      );
      onIntegrationUpdated?.();
    } catch {
      setSyncError(dict.integrations.gscSyncNetworkError);
    } finally {
      setSyncing(false);
    }
  }

  async function handleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && sites.length === 0 && !loading) {
      await loadSites();
    }
  }

  async function handleSelectSite(siteUrl: string) {
    setSubmittingSiteUrl(siteUrl);
    setError(null);
    setSuccessSiteUrl(null);
    setSyncSuccess(false);
    setSyncSummary(null);

    try {
      const response = await authFetch(
        "/api/integrations/google/search-console/select-site",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteUrl }),
        }
      );

      if (!response.ok) {
        const message = await parseApiErrorMessage(response, p.selectSiteFailed);
        setError(message);
        return;
      }

      const body = (await response.json()) as GscSelectSiteResponse;
      setLoadedSelectedSiteUrl(body.data.siteUrl);
      setSuccessSiteUrl(body.data.siteUrl);
      onSiteSelected(body.data.siteUrl);
      onIntegrationUpdated?.();
    } catch {
      setError(p.loadNetworkError);
    } finally {
      setSubmittingSiteUrl(null);
    }
  }

  function permissionLabel(level: string): string {
    const map = p.permissions;
    switch (level) {
      case "siteOwner":
        return map.siteOwner;
      case "siteFullUser":
        return map.siteFullUser;
      case "siteRestrictedUser":
        return map.siteRestrictedUser;
      case "siteUnverifiedUser":
        return map.siteUnverifiedUser;
      default:
        return level;
    }
  }

  const activeSelected = loadedSelectedSiteUrl ?? selectedSiteUrl ?? null;
  const showMismatchState =
    !loading &&
    !error &&
    sites.length > 0 &&
    hasMatchingProperty === false &&
    !activeSelected;
  const showNoPropertiesState =
    !loading && !error && sites.length === 0 && hasMatchingProperty !== null;
  const showPropertyList =
    sites.length > 0 &&
    (!showMismatchState || showOtherProperties || Boolean(activeSelected));

  return (
    <section
      className={cn(
        "rounded-xl border border-blue-500/20 bg-blue-500/5 p-4",
        className
      )}
    >
      <button
        type="button"
        onClick={() => void handleOpen()}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-slate-900">{p.title}</p>
          {activeSelected ? (
            <p className="mt-1 text-xs text-cyan-700">
              {p.currentSite} {activeSelected}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">{p.linkPropertyHint}</p>
          )}
        </div>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        )}
      </button>

      {activeSelected ? (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <GscSyncButton
            onSync={handleSync}
            loading={syncing}
            label={p.syncData}
          />
          {syncError ? (
            <p className="text-xs text-red-600">{syncError}</p>
          ) : null}
          {syncSuccess ? (
            <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-start gap-2 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <p>{p.syncSuccess}</p>
              </div>
              {syncSummary ? (
                <>
                  <GscMetricsSummaryDisplay summary={syncSummary} compact />
                  <GscInsightsList
                    insights={generateGscInsights(syncSummary)}
                    compact
                  />
                </>
              ) : null}
              {syncTasksCreated != null && syncTasksCreated > 0 ? (
                <p className="text-xs text-violet-700">
                  {p.syncTasksCreated(syncTasksCreated)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin" />
              {p.loadingProperties}
            </div>
          ) : null}

          {error ? (
            <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
              <GscPropertyActions
                onRetry={() => void loadSites()}
                onContinueWithoutGsc={onContinueWithoutGsc}
                retryLabel={p.retry}
                continueLabel={p.continueWithoutGsc}
                openSearchConsoleLabel={p.openSearchConsole}
              />
            </div>
          ) : null}

          {successSiteUrl ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <p>
                {p.siteSelected}{" "}
                <span className="font-medium">{successSiteUrl}</span>
              </p>
            </div>
          ) : null}

          {showNoPropertiesState ? (
            <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {p.noPropertiesTitle}
                </p>
                <p className="mt-2 text-sm text-slate-600">{p.noPropertiesText}</p>
              </div>
              <GscPropertyActions
                onRetry={() => void loadSites()}
                onContinueWithoutGsc={onContinueWithoutGsc}
                retryLabel={p.retry}
                continueLabel={p.continueWithoutGsc}
                openSearchConsoleLabel={p.openSearchConsole}
              />
            </div>
          ) : null}

          {showMismatchState && websiteDomain ? (
            <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {p.mismatchTitle}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {p.mismatchText(websiteDomain)}
                </p>
              </div>
              <GscPropertyActions
                onRetry={() => void loadSites()}
                onContinueWithoutGsc={onContinueWithoutGsc}
                retryLabel={p.retry}
                continueLabel={p.continueWithoutGsc}
                openSearchConsoleLabel={p.openSearchConsole}
              />
              {!showOtherProperties ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full border-slate-200 bg-white text-slate-700"
                  onClick={() => setShowOtherProperties(true)}
                >
                  {p.chooseOtherPropertyAnyway}
                </Button>
              ) : null}
            </div>
          ) : null}

          {showPropertyList ? (
            <div className="space-y-3">
              {showMismatchState && showOtherProperties ? (
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {p.otherPropertiesTitle}
                </p>
              ) : null}
              <ul className="space-y-2">
                {sites.map((site) => {
                  const isSelected = activeSelected === site.siteUrl;
                  const isSubmitting = submittingSiteUrl === site.siteUrl;

                  return (
                    <li
                      key={site.siteUrl}
                      className={cn(
                        "rounded-lg border p-3",
                        isSelected
                          ? "border-cyan-500/40 bg-cyan-500/10"
                          : "border-slate-200 bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {site.siteUrl}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {permissionLabel(site.permissionLevel)}
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-700">
                            {p.selected}
                          </span>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={Boolean(submittingSiteUrl)}
                        onClick={() => void handleSelectSite(site.siteUrl)}
                        className="mt-3 w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        variant="outline"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {p.saving}
                          </>
                        ) : (
                          p.useThisSite
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
