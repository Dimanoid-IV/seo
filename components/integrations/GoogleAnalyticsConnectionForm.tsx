"use client";

import { useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { IntegrationOverviewItem } from "@/lib/integrations/types";

type GoogleAnalyticsConnectionFormProps = {
  integration: IntegrationOverviewItem;
  websiteId?: string | null;
  onConnectionUpdated?: () => void;
};

export function GoogleAnalyticsConnectionForm({
  integration,
  websiteId,
  onConnectionUpdated,
}: GoogleAnalyticsConnectionFormProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.googleAnalytics;
  const [propertyId, setPropertyId] = useState(
    integration.analyticsPropertyId ?? ""
  );
  const [loading, setLoading] = useState<"save" | "sync" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!websiteId) return;
    setLoading("save");
    setMessage(null);
    setError(null);
    try {
      const response = await authFetch(
        "/api/integrations/google/analytics/property",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteId, propertyId }),
        }
      );
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.saveFailed));
        return;
      }
      setMessage(t.saved);
      onConnectionUpdated?.();
    } catch {
      setError(t.saveNetworkError);
    } finally {
      setLoading(null);
    }
  }

  async function sync() {
    if (!websiteId) return;
    setLoading("sync");
    setMessage(null);
    setError(null);
    try {
      const response = await authFetch("/api/integrations/google/analytics/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId }),
      });
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.syncFailed));
        return;
      }
      setMessage(t.synced);
      onConnectionUpdated?.();
    } catch {
      setError(t.syncNetworkError);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <BarChart3 className="mt-0.5 size-5 text-[#8169ff]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {t.description}
          </p>
        </div>
      </div>
      <form onSubmit={saveProperty} className="space-y-3">
        <label className="space-y-1 text-xs font-medium text-slate-600">
          {t.propertyId}
          <Input
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            placeholder="123456789"
            required
          />
        </label>
        <p className="text-xs text-slate-500">
          {t.note}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            disabled={!websiteId || loading !== null}
            className="flex-1 bg-[#8169ff] text-white hover:bg-[#6d4ff0]"
          >
            {loading === "save" ? <Loader2 className="size-4 animate-spin" /> : null}
            {t.save}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!websiteId || loading !== null}
            onClick={() => void sync()}
          >
            {loading === "sync" ? <Loader2 className="size-4 animate-spin" /> : null}
            {t.sync}
          </Button>
        </div>
      </form>
      {integration.ga4MetricsSummary ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="rounded-lg bg-white px-3 py-2 text-slate-600">
            {t.users}:{" "}
            <strong className="text-slate-900">
              {Math.round(integration.ga4MetricsSummary.activeUsers)}
            </strong>
          </span>
          <span className="rounded-lg bg-white px-3 py-2 text-slate-600">
            {t.sessions}:{" "}
            <strong className="text-slate-900">
              {Math.round(integration.ga4MetricsSummary.sessions)}
            </strong>
          </span>
          <span className="rounded-lg bg-white px-3 py-2 text-slate-600">
            {t.views}:{" "}
            <strong className="text-slate-900">
              {Math.round(integration.ga4MetricsSummary.screenPageViews)}
            </strong>
          </span>
          <span className="rounded-lg bg-white px-3 py-2 text-slate-600">
            {t.conversions}:{" "}
            <strong className="text-slate-900">
              {Math.round(integration.ga4MetricsSummary.conversions)}
            </strong>
          </span>
        </div>
      ) : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
