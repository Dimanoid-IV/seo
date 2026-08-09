"use client";

import { useState } from "react";
import { FileCode2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type WebflowConnectionFormProps = {
  websiteId?: string | null;
  connected?: boolean;
  onConnectionUpdated?: () => void;
};

export function WebflowConnectionForm({
  websiteId,
  connected = false,
  onConnectionUpdated,
}: WebflowConnectionFormProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.webflow;
  const [siteId, setSiteId] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [token, setToken] = useState("");
  const [bodyField, setBodyField] = useState("post-body");
  const [summaryField, setSummaryField] = useState("post-summary");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!websiteId) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await authFetch("/api/integrations/webflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          siteId,
          collectionId,
          token,
          fieldMapping: {
            name: "name",
            slug: "slug",
            body: bodyField,
            summary: summaryField,
            metaTitle: "meta-title",
            metaDescription: "meta-description",
          },
        }),
      });
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.connectFailed));
        return;
      }
      setToken("");
      setMessage(t.connected);
      onConnectionUpdated?.();
    } catch {
      setError(t.connectNetworkError);
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    if (!websiteId) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await authFetch("/api/integrations/webflow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId }),
      });
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.disconnectFailed));
        return;
      }
      setMessage(t.disconnected);
      onConnectionUpdated?.();
    } catch {
      setError(t.disconnectNetworkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <FileCode2 className="mt-0.5 size-5 text-[#8169ff]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {t.description}
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            {t.siteId}
            <Input value={siteId} onChange={(e) => setSiteId(e.target.value)} required />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            {t.collectionId}
            <Input
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              required
            />
          </label>
        </div>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          {t.token}
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t.tokenPlaceholder}
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            {t.bodyField}
            <Input value={bodyField} onChange={(e) => setBodyField(e.target.value)} />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            {t.summaryField}
            <Input
              value={summaryField}
              onChange={(e) => setSummaryField(e.target.value)}
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          {t.tokenNote}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            disabled={!websiteId || loading}
            className="flex-1 bg-[#8169ff] text-white hover:bg-[#6d4ff0]"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {t.testAndSave}
          </Button>
          {connected ? (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void disconnect()}
            >
              {t.disconnect}
            </Button>
          ) : null}
        </div>
      </form>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
