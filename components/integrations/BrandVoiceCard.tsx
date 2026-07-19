"use client";

import { useEffect, useState } from "react";
import { Pencil, RefreshCw, Sparkles } from "lucide-react";

import { authFetch } from "@/lib/auth/client-session";
import type {
  BrandVoiceManualPatch,
  BrandVoiceProfile,
} from "@/lib/brand-voice/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

import { BrandVoiceEditor } from "./BrandVoiceEditor";

type BrandVoiceCardProps = {
  websiteId: string;
};

export function BrandVoiceCard({ websiteId }: BrandVoiceCardProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.brandVoice;
  const [profile, setProfile] = useState<BrandVoiceProfile | null>(null);
  const [hasStored, setHasStored] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await authFetch(
          `/api/brand-voice?websiteId=${encodeURIComponent(websiteId)}`
        );
        if (cancelled) return;
        if (!response.ok) {
          setError(t.loadFailed);
          setLoading(false);
          return;
        }
        const body = (await response.json()) as {
          data: {
            profile: BrandVoiceProfile;
            hasStoredProfile: boolean;
          };
        };
        if (cancelled) return;
        setProfile(body.data.profile);
        setHasStored(body.data.hasStoredProfile);
        setError(null);
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

  async function handleRefresh() {
    setBusy(true);
    setError(null);
    try {
      const response = await authFetch("/api/brand-voice/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId }),
      });
      if (!response.ok) {
        setError(t.refreshFailed);
        return;
      }
      const body = (await response.json()) as {
        data: { profile: BrandVoiceProfile };
      };
      setProfile(body.data.profile);
      setHasStored(true);
    } catch {
      setError(t.refreshNetworkError);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(patch: BrandVoiceManualPatch) {
    setBusy(true);
    setError(null);
    try {
      const response = await authFetch("/api/brand-voice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, patch }),
      });
      if (!response.ok) {
        setError(t.saveFailed);
        return;
      }
      const body = (await response.json()) as {
        data: { profile: BrandVoiceProfile };
      };
      setProfile(body.data.profile);
      setHasStored(true);
      setEditorOpen(false);
    } catch {
      setError(t.saveNetworkError);
    } finally {
      setBusy(false);
    }
  }

  const confidence = profile?.confidence ?? "low";
  const confidenceLabel =
    confidence === "high" || confidence === "medium"
      ? t.confidenceEnough
      : t.confidenceThin;

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-sky-100">
          <Sparkles className="size-4 text-sky-700" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{t.title}</h2>
            {!loading && profile ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  confidence === "low"
                    ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                    : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                )}
              >
                {confidenceLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {t.description}
          </p>
          {profile && !loading ? (
            <p className="mt-2 text-xs text-slate-500">
              {t.summary(profile.tone, profile.audience)}
              {hasStored ? "" : ` ${t.defaultHint}`}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => void handleRefresh()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
          {busy ? t.refreshing : t.refresh}
        </button>
        <button
          type="button"
          disabled={busy || loading || !profile}
          onClick={() => setEditorOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Pencil className="size-3.5" />
          {t.editManual}
        </button>
      </div>

      {editorOpen && profile ? (
        <BrandVoiceEditor
          profile={profile}
          busy={busy}
          onCancel={() => setEditorOpen(false)}
          onSave={(patch) => void handleSave(patch)}
        />
      ) : null}
    </section>
  );
}
