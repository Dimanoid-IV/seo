"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Plug,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { IntegrationOverviewItem } from "@/lib/integrations/types";
import type { WordPressCreateConnectionResponse } from "@/lib/integrations/wordpress-types";
import { formatRelativeTime } from "@/lib/dashboard/display";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type WordPressConnectorPanelProps = {
  integration: IntegrationOverviewItem;
  websiteId?: string | null;
  onConnectionUpdated?: () => void;
  className?: string;
};

export function WordPressConnectorPanel({
  integration,
  websiteId,
  onConnectionUpdated,
  className,
}: WordPressConnectorPanelProps) {
  const { dict } = useSaasTranslations();
  const wp = dict.integrations.wordpress;
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiSecret, setApiSecret] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"key" | "secret" | null>(null);

  const wpConnection = integration.wordpress;
  const connectionStatus = wpConnection?.connectionStatus ?? null;
  const isConnected =
    integration.connected || connectionStatus === "CONNECTED";
  const isPending = connectionStatus === "PENDING" && !isConnected;

  function permissionLabel(key: string, value: boolean): string {
    const labels = wp.permissions;
    const label =
      labels[key as keyof typeof labels] ?? key;
    return `${label}: ${value ? wp.permissionYes : wp.permissionNo}`;
  }

  async function handleCreateConnection() {
    if (!websiteId) {
      return;
    }

    setCreating(true);
    setError(null);
    setInfoMessage(null);
    setApiKey(null);
    setApiSecret(null);

    try {
      const response = await authFetch(
        "/api/integrations/wordpress/create-connection",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteId }),
        }
      );

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(
            response,
            wp.createKeyFailed
          )
        );
        return;
      }

      const body = (await response.json()) as WordPressCreateConnectionResponse;

      if (body.data.apiKey) {
        setApiKey(body.data.apiKey);
      }
      if (body.data.apiSecret) {
        setApiSecret(body.data.apiSecret);
      }
      if (body.data.message) {
        setInfoMessage(body.data.message);
      }

      onConnectionUpdated?.();
    } catch {
      setError(wp.createKeyNetworkError);
    } finally {
      setCreating(false);
    }
  }

  async function handleCopyValue(value: string, field: "key" | "secret") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  }

  if (isConnected) {
    return (
      <section
        className={cn(
          "space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4",
          className
        )}
      >
        <div className="flex items-start gap-2 text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-medium">{wp.connected}</p>
            {wpConnection?.siteUrl ? (
              <p className="mt-1 text-xs text-slate-400">{wpConnection.siteUrl}</p>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-cyan-100/90">{wp.draftOnlyMessage}</p>

        <dl className="grid gap-2 text-xs text-slate-400">
          {wpConnection?.pluginVersion ? (
            <div>
              <dt className="text-slate-500">{wp.pluginVersion}</dt>
              <dd className="text-slate-600">{wpConnection.pluginVersion}</dd>
            </div>
          ) : null}
          {wpConnection?.lastPingAt ? (
            <div>
              <dt className="text-slate-500">{wp.lastPing}</dt>
              <dd className="text-slate-600">
                {formatRelativeTime(wpConnection.lastPingAt)}
              </dd>
            </div>
          ) : null}
        </dl>

        {wpConnection?.permissions ? (
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">
              {wp.permissionsTitle}
            </p>
            <ul className="space-y-1 text-xs text-slate-400">
              {Object.entries(wpConnection.permissions).map(([key, value]) => (
                <li key={key}>{permissionLabel(key, value)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    );
  }

  if (isPending) {
    return (
      <section
        className={cn(
          "space-y-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4",
          className
        )}
      >
        <div className="flex items-start gap-2">
          <Plug className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-100">{wp.pendingTitle}</p>
            <p className="mt-1 text-xs text-slate-400">{wp.pendingDescription}</p>
            {wpConnection?.siteUrl ? (
              <p className="mt-2 text-xs text-slate-500">{wpConnection.siteUrl}</p>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-cyan-100/90">{wp.draftOnlyMessage}</p>

        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-400">
          {wp.setupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4",
        className
      )}
    >
      <p className="text-sm text-slate-600">{wp.createKeyDescription}</p>
      <p className="text-xs text-cyan-100/90">{wp.draftOnlyMessage}</p>

      <Button
        type="button"
        onClick={() => void handleCreateConnection()}
        disabled={creating || !websiteId}
        className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:from-sky-500 hover:to-indigo-500"
      >
        {creating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {wp.creatingKey}
          </>
        ) : (
          wp.createKey
        )}
      </Button>

      {!websiteId ? (
        <p className="text-xs text-amber-400/90">{wp.addWebsiteForKey}</p>
      ) : null}

      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      {infoMessage ? (
        <p className="text-xs text-amber-200">{infoMessage}</p>
      ) : null}

      {apiKey || apiSecret ? (
        <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-start gap-2 text-amber-100">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <p className="text-xs">{wp.saveKeysNow}</p>
          </div>

          {apiKey ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">{wp.apiKey}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-black/30 px-3 py-2 text-xs text-cyan-200">
                  {apiKey}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopyValue(apiKey, "key")}
                  className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  aria-label={wp.copyKeyAria}
                >
                  <Copy className="size-4" />
                </button>
              </div>
              {copiedField === "key" ? (
                <p className="text-xs text-emerald-300">{wp.keyCopied}</p>
              ) : null}
            </div>
          ) : null}

          {apiSecret ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">{wp.sharedSecret}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-black/30 px-3 py-2 text-xs text-cyan-200">
                  {apiSecret}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopyValue(apiSecret, "secret")}
                  className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  aria-label={wp.copySecretAria}
                >
                  <Copy className="size-4" />
                </button>
              </div>
              {copiedField === "secret" ? (
                <p className="text-xs text-emerald-300">{wp.secretCopied}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-slate-900">{wp.instructions}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-400">
          {wp.setupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
