"use client";

import { useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type ShopifyConnectionFormProps = {
  websiteId?: string | null;
  connected?: boolean;
  onConnectionUpdated?: () => void;
};

export function ShopifyConnectionForm({
  websiteId,
  connected = false,
  onConnectionUpdated,
}: ShopifyConnectionFormProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.shopify;
  const [shopDomain, setShopDomain] = useState("");
  const [blogId, setBlogId] = useState("");
  const [token, setToken] = useState("");
  const [authorName, setAuthorName] = useState("RankBoost");
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
      const response = await authFetch("/api/integrations/shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          shopDomain,
          blogId,
          token,
          authorName,
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
      const response = await authFetch("/api/integrations/shopify", {
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
        <ShoppingBag className="mt-0.5 size-5 text-[#8169ff]" aria-hidden />
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
            {t.shopDomain}
            <Input
              value={shopDomain}
              onChange={(event) => setShopDomain(event.target.value)}
              placeholder="your-store.myshopify.com"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            {t.blogId}
            <Input
              value={blogId}
              onChange={(event) => setBlogId(event.target.value)}
              placeholder="gid://shopify/Blog/1234567890"
              required
            />
          </label>
        </div>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          {t.token}
          <Input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={t.tokenPlaceholder}
            required
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          {t.authorName}
          <Input
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="RankBoost"
          />
        </label>
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
