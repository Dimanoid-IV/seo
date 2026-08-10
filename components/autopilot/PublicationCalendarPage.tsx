"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import {
  buildPublicationCalendarDays,
  type PublicationCalendarEntry,
  type PublicationCalendarData,
} from "@/lib/autopilot/publication-calendar";
import type { AutopilotPlanItemStatus } from "@/lib/autopilot/plan-item-types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { cn } from "@/lib/utils";

type ApiResponse = { data: PublicationCalendarData };

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function localeCode(locale: SaasLocale): string {
  return locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-US";
}

function formatMonth(monthKey: string, locale: SaasLocale): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(localeCode(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatDate(value: string, locale: SaasLocale): string {
  return new Intl.DateTimeFormat(localeCode(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(value));
}

function todayKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

export function PublicationCalendarPage() {
  const { dict, locale } = useSaasTranslations();
  const t = dict.publicationCalendar;
  const [month, setMonth] = useState(currentMonthKey);
  const [data, setData] = useState<PublicationCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PublicationCalendarEntry | null>(null);

  const requestCalendar = useCallback(async (targetMonth: string) => {
    const response = await authFetch(
      `/api/autopilot/publication-calendar?month=${encodeURIComponent(targetMonth)}`
    );
    if (!response.ok) {
      throw new Error(await parseApiErrorMessage(response, t.loadFailed));
    }
    const body = (await response.json()) as ApiResponse;
    return body.data;
  }, [t.loadFailed]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const nextData = await requestCalendar(month);
        if (!cancelled) {
          setData(nextData);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : dict.common.networkError
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [dict.common.networkError, month, requestCalendar]);

  function selectMonth(nextMonth: string) {
    if (nextMonth === month) {
      void handleRetry();
      return;
    }
    setLoading(true);
    setData(null);
    setMonth(nextMonth);
  }

  async function handleRetry() {
    setLoading(true);
    setError(null);
    try {
      setData(await requestCalendar(month));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : dict.common.networkError
      );
    } finally {
      setLoading(false);
    }
  }

  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);
  const days = useMemo(() => buildPublicationCalendarDays(month), [month]);
  const entriesByDay = useMemo(() => {
    const map = new Map<string, PublicationCalendarEntry[]>();
    for (const entry of entries) {
      map.set(entry.dateKey, [...(map.get(entry.dateKey) ?? []), entry]);
    }
    return map;
  }, [entries]);

  const readyCount = entries.filter(
    (entry) => entry.item.generatedArticleId && entry.item.status !== "published"
  ).length;
  const publishedCount = entries.filter((entry) => entry.item.status === "published").length;
  const nextEntry = entries.find(
    (entry) => entry.dateKey >= todayKey() && entry.item.status !== "published"
  );
  const statusLabel = (status: AutopilotPlanItemStatus) =>
    t.statuses[status] ?? status;

  if (loading && !data) {
    return <PageLoadingState message={t.loading} />;
  }

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Link
            href="/app/autopilot"
            className="inline-flex items-center gap-2 rounded-lg border border-[#c9bfff]/60 bg-white px-4 py-2.5 text-sm font-semibold text-[#6d4ff0] transition hover:bg-[#c9bfff]/15"
          >
            {t.openPlan}
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      {error ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button variant="outline" onClick={() => void handleRetry()}>
            {dict.common.tryAgain}
          </Button>
        </div>
      ) : null}

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t.scheduled, value: entries.length, icon: CalendarDays, color: "text-[#6d4ff0]" },
          { label: t.ready, value: readyCount, icon: FileText, color: "text-cyan-600" },
          { label: t.published, value: publishedCount, icon: CheckCircle2, color: "text-emerald-600" },
          {
            label: t.nextPublication,
            value: nextEntry ? formatDate(nextEntry.publishAt, locale) : t.noDate,
            icon: Clock3,
            color: "text-amber-600",
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Icon className={cn("size-4", metric.color)} />
                {metric.label}
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900">{metric.value}</p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-lg font-bold capitalize text-slate-900">
              {formatMonth(month, locale)}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {(data?.approvedPlanCount ?? 0) > 0 ? t.approvedHint : t.draftHint}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label={t.previousMonth} onClick={() => selectMonth(shiftMonth(month, -1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => selectMonth(currentMonthKey())}>
              {t.today}
            </Button>
            <Button variant="outline" size="icon" aria-label={t.nextMonth} onClick={() => selectMonth(shiftMonth(month, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#c9bfff]/25 text-[#6d4ff0]">
              <CalendarDays className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{t.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
              {t.emptyDescription}
            </p>
            <Link href="/app/autopilot" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#8169ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6d4ff0]">
              {t.openPlan}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-7 border-b border-slate-200 bg-slate-50 md:grid">
              {t.weekdays.map((weekday) => (
                <div key={weekday} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {weekday}
                </div>
              ))}
            </div>
            <div className="hidden grid-cols-7 md:grid">
              {days.map((day) => {
                const dayEntries = entriesByDay.get(day.dateKey) ?? [];
                const isToday = day.dateKey === todayKey();
                return (
                  <div
                    key={day.dateKey}
                    className={cn(
                      "min-h-32 border-b border-r border-slate-100 p-2",
                      !day.inCurrentMonth && "bg-slate-50/70"
                    )}
                  >
                    <span className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                      isToday ? "bg-[#8169ff] text-white" : day.inCurrentMonth ? "text-slate-700" : "text-slate-300"
                    )}>
                      {day.dayNumber}
                    </span>
                    <div className="mt-1 space-y-1.5">
                      {dayEntries.map((entry) =>
                        entry.item.generatedArticleId ? (
                          <Link
                            key={entry.item.id}
                            href={`/app/articles/${entry.item.generatedArticleId}`}
                            className="block rounded-lg border border-[#c9bfff]/60 bg-[#c9bfff]/20 p-2 transition hover:border-[#8169ff] hover:bg-[#c9bfff]/35"
                          >
                            <p className="line-clamp-3 text-xs font-semibold leading-snug text-slate-900">{entry.item.title}</p>
                            <span className="mt-1 block text-[10px] font-medium text-[#6d4ff0]">{statusLabel(entry.item.status)}</span>
                          </Link>
                        ) : (
                          <button
                            key={entry.item.id}
                            type="button"
                            onClick={() => setSelectedEntry(entry)}
                            className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-[#c9bfff] hover:bg-[#c9bfff]/10"
                          >
                            <p className="line-clamp-3 text-xs font-semibold leading-snug text-slate-800">{entry.item.title}</p>
                            <span className="mt-1 block text-[10px] font-medium text-slate-500">{t.preparing}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {entries.map((entry) => {
                const content = (
                  <>
                    <div className="min-w-16 text-center">
                      <p className="text-2xl font-bold text-slate-900">{new Date(entry.publishAt).getUTCDate()}</p>
                      <p className="text-xs capitalize text-slate-500">{formatDate(entry.publishAt, locale).split(",")[0]}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-slate-900">{entry.item.title}</p>
                      <p className="mt-1 text-xs font-medium text-[#6d4ff0]">{statusLabel(entry.item.status)}</p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-slate-400" />
                  </>
                );
                return entry.item.generatedArticleId ? (
                  <Link key={entry.item.id} href={`/app/articles/${entry.item.generatedArticleId}`} className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50">
                    {content}
                  </Link>
                ) : (
                  <button key={entry.item.id} type="button" onClick={() => setSelectedEntry(entry)} className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-slate-50">
                    {content}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <Sheet open={Boolean(selectedEntry)} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-slate-200 p-6 pr-12">
            <SheetTitle className="text-xl font-bold text-slate-900">{selectedEntry?.item.title}</SheetTitle>
            {selectedEntry ? (
              <SheetDescription>{formatDate(selectedEntry.publishAt, locale)}</SheetDescription>
            ) : null}
          </SheetHeader>
          {selectedEntry ? (
            <div className="flex-1 overflow-y-auto p-6">
              <span className="inline-flex rounded-full border border-[#c9bfff]/60 bg-[#c9bfff]/20 px-3 py-1 text-xs font-semibold text-[#6d4ff0]">
                {statusLabel(selectedEntry.item.status)}
              </span>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                {selectedEntry.item.reason || t.preparingDescription}
              </p>
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                {t.preparingDescription}
              </div>
            </div>
          ) : null}
          <SheetFooter className="border-t border-slate-200 p-6">
            <Link href="/app/autopilot" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#8169ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6d4ff0]">
              {t.openPlan}
              <ArrowRight className="size-4" />
            </Link>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}
