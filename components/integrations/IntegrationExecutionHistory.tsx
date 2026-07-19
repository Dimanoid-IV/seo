"use client";

import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";

import { authFetch } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type ExecutionRow = {
  id: string;
  action: string;
  provider: string;
  status: string;
  capability: string;
  createdAt: string;
  errorMessage: string | null;
};

type IntegrationExecutionHistoryProps = {
  websiteId: string;
  className?: string;
};

/**
 * Read-only execution history. Does not trigger publish/webhook actions.
 */
export function IntegrationExecutionHistory({
  websiteId,
  className,
}: IntegrationExecutionHistoryProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.executionHistory;
  const [rows, setRows] = useState<ExecutionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch(
          `/api/integrations/executions?websiteId=${encodeURIComponent(websiteId)}`
        );
        if (!response.ok) {
          if (!cancelled) setError(t.loadFailed);
          return;
        }
        const body = (await response.json()) as {
          data: { executions: ExecutionRow[] };
        };
        if (!cancelled) setRows(body.data.executions ?? []);
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

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/70 p-5",
        className
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <History className="mt-0.5 size-4 shrink-0 text-slate-500" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.description}</p>
          <p className="mt-1 text-xs text-slate-500">{t.safetyNote}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          {t.loading}
        </div>
      ) : null}

      {!loading && error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t.empty}</p>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-800">
                {row.provider} · {row.action}
              </span>
              <span className="text-slate-500">{row.status}</span>
              <span className="w-full text-xs text-slate-400">
                {new Date(row.createdAt).toLocaleString()}
                {row.errorMessage ? ` — ${row.errorMessage}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
