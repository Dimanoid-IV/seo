"use client";

import { useState } from "react";
import { Loader2, MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { IntegrationOverviewItem } from "@/lib/integrations/types";

type GoogleBusinessProfileConnectionFormProps = {
  integration: IntegrationOverviewItem;
  websiteId?: string | null;
  onConnectionUpdated?: () => void;
};

export function GoogleBusinessProfileConnectionForm({
  integration,
  websiteId,
  onConnectionUpdated,
}: GoogleBusinessProfileConnectionFormProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.googleBusinessProfile;
  const [accountId, setAccountId] = useState(
    integration.businessProfileAccountId ?? ""
  );
  const [locationId, setLocationId] = useState(
    integration.businessProfileLocationId ?? ""
  );
  const [loading, setLoading] = useState<"save" | "sync" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveLocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!websiteId) return;
    setLoading("save");
    setMessage(null);
    setError(null);
    try {
      const response = await authFetch(
        "/api/integrations/google/business-profile/location",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteId, accountId, locationId }),
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
      const response = await authFetch(
        "/api/integrations/google/business-profile/sync",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteId }),
        }
      );
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

  const summary = integration.googleBusinessProfileSummary;

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <MapPinned className="mt-0.5 size-5 text-[#8169ff]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{t.description}</p>
        </div>
      </div>

      <form onSubmit={saveLocation} className="space-y-3">
        <label className="space-y-1 text-xs font-medium text-slate-600">
          {t.accountId}
          <Input
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            placeholder="1234567890"
            required
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          {t.locationId}
          <Input
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            placeholder="9876543210"
            required
          />
        </label>
        <p className="text-xs text-slate-500">{t.note}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            disabled={!websiteId || loading !== null}
            className="flex-1 bg-[#8169ff] text-white hover:bg-[#6d4ff0]"
          >
            {loading === "save" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {t.save}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!websiteId || loading !== null}
            onClick={() => void sync()}
          >
            {loading === "sync" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {t.sync}
          </Button>
        </div>
      </form>

      {summary ? (
        <div className="space-y-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
          {summary.title ? (
            <p>
              {t.business}:{" "}
              <strong className="text-slate-900">{summary.title}</strong>
            </p>
          ) : null}
          {summary.primaryCategory ? (
            <p>
              {t.category}:{" "}
              <strong className="text-slate-900">
                {summary.primaryCategory}
              </strong>
            </p>
          ) : null}
          {summary.address ? <p>{summary.address}</p> : null}
          {summary.websiteUri ? (
            <p className="truncate">{summary.websiteUri}</p>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
