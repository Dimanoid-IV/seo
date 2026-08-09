"use client";

import { useState } from "react";
import { GitPullRequest, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type GitHubPrConnectionFormProps = {
  websiteId?: string | null;
  connected?: boolean;
  onConnectionUpdated?: () => void;
};

export function GitHubPrConnectionForm({
  websiteId,
  connected = false,
  onConnectionUpdated,
}: GitHubPrConnectionFormProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.githubPr;
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [contentPath, setContentPath] = useState("content/blog");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!websiteId) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await authFetch("/api/integrations/github-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          owner,
          repo,
          baseBranch,
          contentPath,
          token,
        }),
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, t.connectFailed));
        return;
      }

      const body = (await response.json()) as {
        data?: {
          config?: {
            owner: string;
            repo: string;
            baseBranch: string;
            contentPath: string;
          };
        };
      };
      const config = body.data?.config;
      setMessage(
        config
          ? t.connected(`${config.owner}/${config.repo}`, config.contentPath)
          : t.connectedFallback
      );
      setToken("");
      onConnectionUpdated?.();
    } catch {
      setError(t.connectNetworkError);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!websiteId) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await authFetch("/api/integrations/github-pr", {
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
        <GitPullRequest className="mt-0.5 size-5 text-[#8169ff]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {t.description}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            {t.owner}
            <Input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="company"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            {t.repo}
            <Input
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="website"
              required
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            {t.baseBranch}
            <Input
              value={baseBranch}
              onChange={(event) => setBaseBranch(event.target.value)}
              placeholder="main"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            {t.contentPath}
            <Input
              value={contentPath}
              onChange={(event) => setContentPath(event.target.value)}
              placeholder="content/blog"
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
              onClick={() => void handleDisconnect()}
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
