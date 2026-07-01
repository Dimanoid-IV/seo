"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

import { GscSyncButton } from "@/components/integrations/GoogleSearchConsoleDashboardCard";
import { GscMetricsSummaryDisplay } from "@/components/integrations/GscMetricsSummary";
import { GscInsightsList } from "@/components/integrations/GscInsightsList";
import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type {
  GscSelectSiteResponse,
  GscSitesResponse,
  GscSyncResponse,
  SearchConsoleSite,
} from "@/lib/integrations/gsc-types";
import { generateGscInsights } from "@/lib/integrations/gsc-insights";
import { cn } from "@/lib/utils";

type GoogleSearchConsolePropertyPickerProps = {
  selectedSiteUrl?: string | null;
  websiteId?: string | null;
  onSiteSelected: (siteUrl: string) => void;
  onIntegrationUpdated?: () => void;
  className?: string;
};

const PERMISSION_LABELS: Record<string, string> = {
  siteOwner: "Владелец",
  siteFullUser: "Полный доступ",
  siteRestrictedUser: "Ограниченный доступ",
  siteUnverifiedUser: "Не подтверждён",
};

function permissionLabel(level: string): string {
  return PERMISSION_LABELS[level] ?? level;
}

export function GoogleSearchConsolePropertyPicker({
  selectedSiteUrl,
  websiteId,
  onSiteSelected,
  onIntegrationUpdated,
  className,
}: GoogleSearchConsolePropertyPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submittingSiteUrl, setSubmittingSiteUrl] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [sites, setSites] = useState<SearchConsoleSite[]>([]);
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

    try {
      const response = await authFetch(
        "/api/integrations/google/search-console/sites"
      );

      if (!response.ok) {
        const message = await parseApiErrorMessage(
          response,
          "Не удалось загрузить сайты Search Console"
        );
        setError(message);
        return;
      }

      const body = (await response.json()) as GscSitesResponse;
      setSites(body.data.sites);
      setLoadedSelectedSiteUrl(body.data.selectedSiteUrl);
    } catch {
      setError("Сетевая ошибка при загрузке сайтов Search Console");
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
          "Не удалось загрузить данные Search Console"
        );
        setSyncError(message);
        return;
      }

      const body = (await response.json()) as GscSyncResponse;
      setSyncSummary(body.data.summary);
      setSyncSuccess(true);
      setSyncTasksCreated(body.data.tasksCreated ?? body.data.tasksCreatedLastSync ?? 0);
      onIntegrationUpdated?.();
    } catch {
      setSyncError("Сетевая ошибка при загрузке данных Search Console");
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
        const message = await parseApiErrorMessage(
          response,
          "Не удалось сохранить выбранный сайт"
        );
        setError(message);
        return;
      }

      const body = (await response.json()) as GscSelectSiteResponse;
      setLoadedSelectedSiteUrl(body.data.siteUrl);
      setSuccessSiteUrl(body.data.siteUrl);
      onSiteSelected(body.data.siteUrl);
      onIntegrationUpdated?.();
    } catch {
      setError("Сетевая ошибка при сохранении сайта Search Console");
    } finally {
      setSubmittingSiteUrl(null);
    }
  }

  const activeSelected = loadedSelectedSiteUrl ?? selectedSiteUrl ?? null;

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
          <p className="text-sm font-medium text-white">
            Выбрать сайт из Search Console
          </p>
          {activeSelected ? (
            <p className="mt-1 text-xs text-cyan-300/90">
              Текущий: {activeSelected}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Свяжите property Google с сайтом в RankBoost
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        )}
      </button>

      {activeSelected ? (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <GscSyncButton
            onSync={handleSync}
            loading={syncing}
            label="Загрузить данные Search Console"
          />
          {syncError ? (
            <p className="text-xs text-red-300">{syncError}</p>
          ) : null}
          {syncSuccess ? (
            <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-start gap-2 text-sm text-emerald-100">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <p>Данные Search Console загружены за последние 28 дней.</p>
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
                <p className="text-xs text-violet-200">
                  Создано {syncTasksCreated} новых задач — они появятся в
                  Dashboard.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin" />
              Загружаем properties…
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void loadSites()}
                  className="mt-2 text-xs text-red-100 underline"
                >
                  Повторить
                </button>
              </div>
            </div>
          ) : null}

          {successSiteUrl ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <p>
                Сайт Search Console выбран:{" "}
                <span className="font-medium">{successSiteUrl}</span>
              </p>
            </div>
          ) : null}

          {!loading && sites.length === 0 && !error ? (
            <p className="text-sm text-slate-400">
              В Google Search Console пока нет доступных properties для этого
              аккаунта.
            </p>
          ) : null}

          {sites.length > 0 ? (
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
                        : "border-white/10 bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {site.siteUrl}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {permissionLabel(site.permissionLevel)}
                        </p>
                      </div>
                      {isSelected ? (
                        <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-200">
                          Выбран
                        </span>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={Boolean(submittingSiteUrl)}
                      onClick={() => void handleSelectSite(site.siteUrl)}
                      className="mt-3 w-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      variant="outline"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Сохраняем…
                        </>
                      ) : (
                        "Использовать этот сайт"
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
