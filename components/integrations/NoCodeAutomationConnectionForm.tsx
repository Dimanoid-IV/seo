"use client";

import { useState } from "react";
import { Loader2, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type NoCodeAutomationProvider = "zapier" | "make";

type NoCodeAutomationConnectionFormProps = {
  websiteId?: string | null;
  provider: NoCodeAutomationProvider;
  connected?: boolean;
  onConnectionUpdated?: () => void;
};

export function NoCodeAutomationConnectionForm({
  websiteId,
  provider,
  connected = false,
  onConnectionUpdated,
}: NoCodeAutomationConnectionFormProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.noCodeAutomation;
  const providerLabel = provider === "zapier" ? "Zapier" : "Make";
  const [endpointUrl, setEndpointUrl] = useState("");
  const [sharedSecret, setSharedSecret] = useState("");
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
      const response = await authFetch("/api/integrations/no-code-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          provider,
          endpointUrl,
          sharedSecret: sharedSecret.trim() || undefined,
        }),
      });
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.connectFailed(providerLabel)));
        return;
      }
      setSharedSecret("");
      setMessage(t.connected(providerLabel));
      onConnectionUpdated?.();
    } catch {
      setError(t.connectNetworkError(providerLabel));
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
      const response = await authFetch("/api/integrations/no-code-automation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, provider }),
      });
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.disconnectFailed(providerLabel)));
        return;
      }
      setMessage(t.disconnected(providerLabel));
      onConnectionUpdated?.();
    } catch {
      setError(t.disconnectNetworkError(providerLabel));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <Workflow className="mt-0.5 size-5 text-[#8169ff]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t.title(providerLabel)}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {t.description(providerLabel)}
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <label className="space-y-1 text-xs font-medium text-slate-600">
          {t.webhookUrl}
          <Input
            type="url"
            value={endpointUrl}
            onChange={(event) => setEndpointUrl(event.target.value)}
            placeholder={
              provider === "zapier"
                ? "https://hooks.zapier.com/hooks/catch/..."
                : "https://hook.eu1.make.com/..."
            }
            required
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          {t.sharedSecret}
          <Input
            type="password"
            value={sharedSecret}
            onChange={(event) => setSharedSecret(event.target.value)}
            placeholder={t.sharedSecretPlaceholder}
          />
        </label>
        <p className="text-xs text-slate-500">
          {t.tokenNote(providerLabel)}
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
