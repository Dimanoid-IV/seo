"use client";

import Link from "next/link";

import type { TimelineEventViewModel } from "@/lib/timeline/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

import { TimelineEventIcon } from "./TimelineEventIcon";

type TimelineEventCardProps = {
  event: TimelineEventViewModel;
  className?: string;
};

const SEVERITY_STYLES: Record<string, string> = {
  INFO: "border-slate-200 bg-slate-50",
  SUCCESS: "border-emerald-500/20 bg-emerald-500/5",
  WARNING: "border-amber-500/20 bg-amber-500/5",
  ERROR: "border-red-500/20 bg-red-500/5",
  OPPORTUNITY: "border-blue-500/20 bg-blue-500/5",
};

export function TimelineEventCard({ event, className }: TimelineEventCardProps) {
  const { dict } = useSaasTranslations();

  return (
    <article
      className={cn(
        "rounded-xl border p-4 sm:p-5",
        SEVERITY_STYLES[event.severity] ?? SEVERITY_STYLES.INFO,
        !event.isRead && "ring-1 ring-blue-500/20",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-blue-300">
          <TimelineEventIcon type={event.type} severity={event.severity} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">
              {event.source}
            </span>
            <span className="text-xs text-slate-500">{event.relativeTime}</span>
            {!event.isRead ? (
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-300">
                {dict.timeline.new}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 font-semibold text-slate-900">{event.title}</h3>
          {event.summary ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {event.summary}
            </p>
          ) : null}
          {event.action ? (
            <Link
              href={event.action.href}
              className="mt-3 inline-flex text-sm font-medium text-blue-300 hover:text-blue-200"
            >
              {event.action.label}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
