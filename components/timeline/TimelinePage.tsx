"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { TimelineListResult } from "@/lib/timeline/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

import { TimelineEmptyState } from "./TimelineEmptyState";
import { TimelineEventCard } from "./TimelineEventCard";
import { TimelineSummaryCard } from "./TimelineSummaryCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";

type TimelineResponse = {
  data: TimelineListResult;
};

const EMPTY_TIMELINE: TimelineListResult = {
  events: [],
  unreadCount: 0,
  summary: {
    totalEvents: 0,
    importantEvents: [],
    newTasksCount: 0,
    completedTasksCount: 0,
    opportunitiesCount: 0,
    warningsCount: 0,
    headline: "",
  },
  websiteId: null,
  nextCursor: null,
};

export function TimelinePage() {
  const { dict, locale } = useSaasTranslations();
  const t = dict.timeline;
  const [timeline, setTimeline] = useState<TimelineListResult>(EMPTY_TIMELINE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

  const loadTimeline = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await authFetch("/api/timeline?limit=30");

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, t.loadFailed)
        );
        return;
      }

      const body = (await response.json()) as TimelineResponse;
      setTimeline(body.data);
    } catch {
      setError(t.loadNetworkError);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [t.loadFailed, t.loadNetworkError]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialTimeline() {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch("/api/timeline?limit=30");

        if (!response.ok) {
          if (!cancelled) {
            setError(
              await parseApiErrorMessage(response, t.loadFailed)
            );
            setLoading(false);
          }
          return;
        }

        const body = (await response.json()) as TimelineResponse;
        if (!cancelled) {
          setTimeline(body.data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(t.loadNetworkError);
          setLoading(false);
        }
      }
    }

    void loadInitialTimeline();

    return () => {
      cancelled = true;
    };
  }, [locale, t.loadFailed, t.loadNetworkError]);

  const gscHintVisible = useMemo(
    () =>
      timeline.events.every(
        (event) =>
          event.type !== "GSC_OPPORTUNITY_FOUND" &&
          event.type !== "GSC_INSIGHT_FOUND" &&
          event.type !== "INTEGRATION_CONNECTED"
      ),
    [timeline.events]
  );

  async function handleMarkRead() {
    setMarkingRead(true);
    setError(null);

    try {
      const response = await authFetch("/api/timeline/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, t.markReadFailed)
        );
        return;
      }

      await loadTimeline({ silent: true });
    } catch {
      setError(t.markReadNetworkError);
    } finally {
      setMarkingRead(false);
    }
  }

  if (loading) {
    return <PageLoadingState message={t.loading} />;
  }

  if (error) {
    return (
      <PageErrorState
        message={error || PAGE_ERROR_FALLBACK}
        onRetry={() => void loadTimeline()}
      />
    );
  }

  if (!timeline.websiteId) {
    return (
      <main className="app-content mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <TimelineEmptyState variant="no-website" />
      </main>
    );
  }

  return (
    <main className="app-content mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <TimelineSummaryCard
        summary={timeline.summary}
        unreadCount={timeline.unreadCount}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{t.activityTitle}</h3>
          <p className="text-sm text-slate-500">{t.activitySubtitle}</p>
        </div>
        {timeline.unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkRead()}
            disabled={markingRead}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-60"
          >
            {markingRead ? <Loader2 className="size-4 animate-spin" /> : null}
            {t.markAllRead}
          </button>
        ) : null}
      </div>

      {gscHintVisible ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
          {t.gscHint}
        </p>
      ) : null}

      {timeline.events.length > 0 ? (
        <div className="space-y-3">
          {timeline.events.map((event) => (
            <TimelineEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <TimelineEmptyState variant="no-events" />
      )}
    </main>
  );
}
