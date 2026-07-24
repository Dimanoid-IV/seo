"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, SearchCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type ManualCompetitor = {
  domain: string;
  url: string;
};

type CompetitorSettingsCardProps = {
  websiteId: string;
};

function competitorsToLines(competitors: ManualCompetitor[]): string {
  return competitors.map((competitor) => competitor.url || competitor.domain).join("\n");
}

function linesToCompetitors(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function CompetitorSettingsCard({ websiteId }: CompetitorSettingsCardProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.competitors;
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch(
          `/api/content-research/competitors?websiteId=${encodeURIComponent(websiteId)}`
        );
        if (cancelled) return;
        if (!response.ok) {
          setError(await parseApiErrorMessage(response, t.loadFailed));
          return;
        }
        const body = (await response.json()) as {
          data: { competitors: ManualCompetitor[] };
        };
        setValue(competitorsToLines(body.data.competitors));
      } catch {
        if (!cancelled) setError(t.loadNetworkError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [websiteId, t.loadFailed, t.loadNetworkError]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const response = await authFetch("/api/content-research/competitors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          competitors: linesToCompetitors(value),
        }),
      });
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.saveFailed));
        return;
      }
      const body = (await response.json()) as {
        data: { competitors: ManualCompetitor[] };
      };
      setValue(competitorsToLines(body.data.competitors));
      setStatus(t.saveSuccess);
    } catch {
      setError(t.saveNetworkError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
          <SearchCheck className="size-4 text-emerald-700" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900">{t.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {t.description}
          </p>
        </div>
      </div>

      <label className="mt-4 block text-xs font-medium text-slate-600">
        {t.fieldLabel}
        <textarea
          value={value}
          disabled={loading}
          onChange={(event) => setValue(event.target.value)}
          rows={4}
          placeholder={t.placeholder}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 disabled:bg-slate-50"
        />
      </label>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{t.helper}</p>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {status ? <p className="mt-3 text-sm text-emerald-700">{status}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={loading || saving}
          onClick={() => void handleSave()}
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? t.saving : t.save}
        </Button>
      </div>
    </section>
  );
}
