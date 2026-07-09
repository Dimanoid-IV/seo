"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";
import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type HermesStatusResponse = {
  data: {
    hermes: {
      configured: boolean;
      testMode: boolean;
      model: string | null;
      connectionOk: boolean | null;
      connectionError: string | null;
    };
  };
};

type GenerateResponse = {
  data: {
    recommendation: {
      type: string;
      title: string;
      summary: string;
      persisted: boolean;
      reviewStatus: string;
      basedOnLimitedData: boolean;
      tasks?: Array<{ id: string; title: string; status: string }>;
      contentBrief?: { id: string; title: string; status: string };
    };
  };
};

type GenerateRecommendationsPanelProps = {
  onGenerated?: () => void;
};

export function GenerateRecommendationsPanel({
  onGenerated,
}: GenerateRecommendationsPanelProps) {
  const { dict } = useSaasTranslations();
  const h = dict.controlCenter.hermes;
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse["data"]["recommendation"] | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await authFetch("/api/hermes/status");
        if (!response.ok) {
          if (!cancelled) {
            setConfigured(false);
          }
          return;
        }
        const body = (await response.json()) as HermesStatusResponse;
        if (!cancelled) {
          setConfigured(body.data.hermes.configured);
        }
      } catch {
        if (!cancelled) {
          setConfigured(false);
        }
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerate(type: "seo_tasks" | "content_brief") {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await authFetch("/api/ai/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, h.generateFailed));
        return;
      }

      const body = (await response.json()) as GenerateResponse;
      setResult(body.data.recommendation);
      onGenerated?.();
    } catch {
      setError(h.generateNetworkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SaasCard variant="muted">
      <SaasSectionHeader title={h.title} subtitle={h.subtitle} />

      {configured === false ? (
        <p className="text-sm leading-relaxed text-slate-400">{h.notConfigured}</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-400">{h.reviewNote}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading || configured !== true}
              className="min-h-10 rounded-xl border-violet-400/20 bg-violet-500/10 text-violet-100 hover:bg-violet-500/15"
              onClick={() => void handleGenerate("seo_tasks")}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {h.generateTasks}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading || configured !== true}
              className="min-h-10 rounded-xl border-slate-200 bg-white text-slate-700"
              onClick={() => void handleGenerate("content_brief")}
            >
              {h.generateBrief}
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-4 text-sm text-red-300/90" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
              {h.needsReview}
            </span>
            {result.basedOnLimitedData ? (
              <span className="text-xs text-slate-500">{h.limitedData}</span>
            ) : null}
          </div>
          <h4 className="font-medium text-slate-900">{result.title}</h4>
          <p className="text-sm leading-relaxed text-slate-400">{result.summary}</p>
          {result.tasks && result.tasks.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-600">
              {result.tasks.slice(0, 3).map((task) => (
                <li key={task.id} className="break-words">
                  • {task.title}
                </li>
              ))}
            </ul>
          ) : null}
          {result.contentBrief ? (
            <p className="text-sm text-slate-600">{result.contentBrief.title}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {result.tasks && result.tasks.length > 0 ? (
              <Button
                render={<Link href="/app/tasks" />}
                nativeButton={false}
                size="sm"
                variant="outline"
                className="rounded-xl border-slate-200 bg-white text-slate-700"
              >
                {h.reviewTasks}
              </Button>
            ) : null}
            {result.contentBrief ? (
              <Button
                render={<Link href="/app/content-plan" />}
                nativeButton={false}
                size="sm"
                variant="outline"
                className="rounded-xl border-slate-200 bg-white text-slate-700"
              >
                {h.reviewBrief}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </SaasCard>
  );
}
