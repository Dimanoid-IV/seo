"use client";

import { IntegrationBenefitList } from "@/components/integrations/IntegrationBenefitList";
import { IntegrationComingSoonForm } from "@/components/integrations/IntegrationComingSoonForm";
import { GoogleSearchConsolePropertyPicker } from "@/components/integrations/GoogleSearchConsolePropertyPicker";
import { GscSyncButton } from "@/components/integrations/GoogleSearchConsoleDashboardCard";
import { GscMetricsSummaryDisplay } from "@/components/integrations/GscMetricsSummary";
import { GscInsightsList } from "@/components/integrations/GscInsightsList";
import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";
import { WordPressConnectorPanel } from "@/components/integrations/WordPressConnectorPanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  INTEGRATION_PROVIDER_DETAILS,
  RISK_LEVEL_LABELS,
} from "@/lib/integrations/provider-details";
import type { IntegrationOverviewItem } from "@/lib/integrations/types";
import type { GscSyncResponse } from "@/lib/integrations/gsc-types";
import { generateGscInsights } from "@/lib/integrations/gsc-insights";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { formatRelativeTime } from "@/lib/dashboard/display";
import { cn } from "@/lib/utils";
import { ArrowRight, Database, Shield, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

const GSC_PROVIDER = "google_search_console";
const WORDPRESS_PROVIDER = "wordpress";

type IntegrationActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: IntegrationOverviewItem | null;
  websiteId?: string | null;
  userEmail?: string | null;
  onIntegrationUpdated?: () => void;
};

function buildGscConnectUrl(websiteId?: string | null): string {
  const params = new URLSearchParams();
  if (websiteId) {
    params.set("websiteId", websiteId);
  }
  const query = params.toString();
  return `/api/integrations/google/connect${query ? `?${query}` : ""}`;
}

function DetailSection({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Database;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="size-4 text-slate-500" aria-hidden />
        {title}
      </h3>
      <ul className="space-y-1.5 text-sm text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-slate-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IntegrationActionSheet({
  open,
  onOpenChange,
  integration,
  websiteId,
  userEmail,
  onIntegrationUpdated,
}: IntegrationActionSheetProps) {
  return (
    <Sheet open={open && Boolean(integration)} onOpenChange={onOpenChange}>
      {integration ? (
        <IntegrationActionSheetContent
          integration={integration}
          websiteId={websiteId}
          userEmail={userEmail}
          onIntegrationUpdated={onIntegrationUpdated}
        />
      ) : null}
    </Sheet>
  );
}

function IntegrationActionSheetContent({
  integration,
  websiteId,
  userEmail,
  onIntegrationUpdated,
}: {
  integration: IntegrationOverviewItem;
  websiteId?: string | null;
  userEmail?: string | null;
  onIntegrationUpdated?: () => void;
}) {
  const details = INTEGRATION_PROVIDER_DETAILS[integration.provider];
  const risk = details ? RISK_LEVEL_LABELS[details.riskLevel] : null;
  const isComingSoon = integration.comingSoon || !integration.available;
  const isConnected = integration.connected && !isComingSoon;
  const isGsc = integration.provider === GSC_PROVIDER;
  const isWordPress = integration.provider === WORDPRESS_PROVIDER;
  const canConnectGsc = isGsc && !isComingSoon && !isConnected && Boolean(websiteId);
  const gscPropertySelected = Boolean(integration.selectedProperty);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSyncGsc() {
    setSyncing(true);
    setSyncError(null);

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
        setSyncError(
          await parseApiErrorMessage(
            response,
            "Не удалось обновить данные Search Console"
          )
        );
        return;
      }

      await (response.json() as Promise<GscSyncResponse>);
      onIntegrationUpdated?.();
    } catch {
      setSyncError("Сетевая ошибка при обновлении данных Search Console");
    } finally {
      setSyncing(false);
    }
  }

  function handleConnectGsc() {
    if (!canConnectGsc) {
      return;
    }
    window.location.href = buildGscConnectUrl(websiteId);
  }

  return (
    <SheetContent
      side="right"
      className="max-h-[100dvh] min-w-0 w-full overflow-y-auto border-white/10 bg-[#0a0f1e] text-slate-200 sm:max-w-lg"
    >
        <SheetHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle className="text-xl text-white">
              {integration.title}
            </SheetTitle>
            <IntegrationStatusBadge
              status={integration.status}
              comingSoon={isComingSoon}
            />
          </div>
          <SheetDescription className="text-slate-400">
            {integration.description}
          </SheetDescription>
          {isConnected && integration.connectedAt ? (
            <p className="text-xs text-emerald-400/90">
              Подключено{" "}
              {new Date(integration.connectedAt).toLocaleString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : null}
          {isGsc && isConnected && !gscPropertySelected ? (
            <p className="text-xs text-amber-400/90">
              Google подключён, но сайт Search Console ещё не выбран.
            </p>
          ) : null}
          {isGsc && isConnected && integration.selectedProperty ? (
            <p className="text-xs text-cyan-300/90">
              Search Console site: {integration.selectedProperty}
            </p>
          ) : null}
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 px-4 py-2">
          <IntegrationBenefitList provider={integration.provider} />

          {details ? (
            <>
              <DetailSection
                title="Какие данные использует RankBoost"
                icon={Database}
                items={details.dataUsed}
              />
              <DetailSection
                title="Что сможет делать RankBoost"
                icon={Zap}
                items={details.actions}
              />

              {risk ? (
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-slate-500" aria-hidden />
                  <span className="text-sm text-slate-400">Уровень риска:</span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      risk.className
                    )}
                  >
                    {risk.label}
                  </span>
                </div>
              ) : null}

              {!isComingSoon ? (
                <>
                  <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100/90">
                    Вы всегда контролируете, что RankBoost может делать
                    автоматически.
                  </p>

                  <section className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ArrowRight className="size-4 text-slate-500" />
                      Путь подключения
                    </h3>
                    <ol className="space-y-2 text-sm text-slate-400">
                      {details.connectionPath.map((step, index) => (
                        <li key={step} className="flex gap-3">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-slate-300">
                            {index + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                </>
              ) : null}
            </>
          ) : null}

          {isComingSoon ? (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="mb-4 flex items-center gap-2 text-violet-300">
                <Sparkles className="size-4" />
                <span className="text-sm font-medium">Скоро в RankBoost</span>
              </div>
              <IntegrationComingSoonForm
                key={integration.provider}
                providerTitle={integration.title}
                defaultEmail={userEmail}
              />
            </div>
          ) : null}

          {isGsc && isConnected ? (
            <GoogleSearchConsolePropertyPicker
              selectedSiteUrl={integration.selectedProperty}
              websiteId={websiteId}
              onSiteSelected={() => onIntegrationUpdated?.()}
              onIntegrationUpdated={onIntegrationUpdated}
            />
          ) : null}

          {isGsc && isConnected && gscPropertySelected ? (
            <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">
                  Метрики за 28 дней
                </h3>
                {integration.lastFetchedAt ? (
                  <span className="text-xs text-slate-500">
                    {formatRelativeTime(integration.lastFetchedAt)}
                  </span>
                ) : null}
              </div>

              {integration.metricsSummary ? (
                <>
                  <GscMetricsSummaryDisplay
                    summary={integration.metricsSummary}
                    compact
                  />
                  <GscInsightsList
                    insights={generateGscInsights(integration.metricsSummary)}
                    compact
                  />
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  Данные ещё не загружены. Нажмите «Обновить данные», чтобы
                  получить клики и показы из Google.
                </p>
              )}

              <GscSyncButton
                onSync={handleSyncGsc}
                loading={syncing}
                label="Обновить данные"
              />
              {syncError ? (
                <p className="text-xs text-red-300">{syncError}</p>
              ) : null}
            </section>
          ) : null}

          {isWordPress && !isComingSoon ? (
            <WordPressConnectorPanel
              integration={integration}
              websiteId={websiteId}
              onConnectionUpdated={onIntegrationUpdated}
            />
          ) : null}
        </div>

        {!isComingSoon && !isWordPress ? (
          <SheetFooter className="border-t border-white/5">
            {isGsc ? (
              isConnected ? (
                <>
                  <Button
                    type="button"
                    disabled
                    variant="outline"
                    className="w-full border border-white/15 bg-white/5 text-slate-300"
                  >
                    Управлять подключением
                  </Button>
                  <p className="text-center text-xs text-slate-500">
                    Disconnect появится позже.
                  </p>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handleConnectGsc}
                    disabled={!canConnectGsc}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500"
                  >
                    Connect Google
                  </Button>
                  {!websiteId ? (
                    <p className="text-center text-xs text-amber-400/90">
                      Добавьте сайт, чтобы начать подключение.
                    </p>
                  ) : (
                    <p className="text-center text-xs text-slate-500">
                      Вы будете перенаправлены на Google для подтверждения
                      доступа только на чтение.
                    </p>
                  )}
                </>
              )
            ) : (
              <>
                <Button
                  type="button"
                  disabled
                  title="OAuth и API подключение появятся в следующем релизе"
                  className={cn(
                    "w-full",
                    isConnected
                      ? "border border-white/15 bg-white/5 text-slate-300"
                      : "bg-gradient-to-r from-blue-600 to-violet-600 text-white opacity-80"
                  )}
                  variant={isConnected ? "outline" : "default"}
                >
                  {isConnected
                    ? "Управлять подключением"
                    : "Продолжить подключение"}
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Подключение через OAuth/API появится в следующем релизе —
                  сейчас только предпросмотр возможностей.
                </p>
              </>
            )}
          </SheetFooter>
        ) : null}
    </SheetContent>
  );
}
