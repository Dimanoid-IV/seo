"use client";

import { useState } from "react";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { setupCopy } from "@/lib/integrations/setup-copy";
import type { AssistedSetupFormData } from "@/lib/validators";
import { Button } from "@/components/ui/button";

export function IntegrationSetupHelp({ provider, websiteId, websiteUrl }: {
  provider: string; websiteId?: string | null; websiteUrl?: string | null;
}) {
  const { locale } = useSaasTranslations();
  const t = setupCopy(locale);
  const { user } = useAuthSession();
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const field = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError(null);
    try {
      const response = await authFetch("/api/integrations/assisted-setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.get("name"), email: fields.get("email"),
          websiteUrl, websiteId: websiteId ?? undefined,
          integrationType: provider.toUpperCase() as AssistedSetupFormData["integrationType"],
          issueType: "NOT_SURE", comment: fields.get("comment"),
          consentGiven: fields.get("consent") === "on", locale,
          sourcePage: "/app/integrations",
        }),
      });
      if (!response.ok) { setError(await parseApiErrorMessage(response, t.failure)); return; }
      const body = await response.json();
      if (!body.data?.requestId) throw new Error("Missing request ID");
      setRequestId(body.data.requestId);
    } catch { setError(t.failure); } finally { setBusy(false); }
  }

  return <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <summary className="cursor-pointer text-sm font-semibold text-slate-900">{t.help}</summary>
    {requestId ? <p role="status" className="mt-3 text-sm text-emerald-800">{t.sent} <span className="block mt-2">#{requestId.slice(0, 8)}</span></p> : <>
      <p className="my-3 text-sm text-slate-600">{t.helpIntro}</p>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">{t.name}<input name="name" autoComplete="name" defaultValue={user?.name ?? ""} required minLength={2} maxLength={100} className={field} /></label>
        <label className="block text-sm">{t.email}<input name="email" type="email" autoComplete="email" defaultValue={user?.email ?? ""} required className={field} /></label>
        <label className="block text-sm">{t.comment}<textarea name="comment" rows={3} maxLength={2000} className={field} /></label>
        <label className="flex items-start gap-2 text-sm"><input name="consent" type="checkbox" required className="mt-1" />{t.consent}</label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={busy || !websiteId || !websiteUrl}>{busy ? "…" : t.request}</Button>
      </form>
    </>}
  </details>;
}
