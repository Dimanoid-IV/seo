"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ControlCenterRecentActivity } from "@/lib/autopilot-control/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

import { ControlEmptyState } from "./ControlEmptyState";

type RecentActivityPanelProps = {
  events: ControlCenterRecentActivity[];
};

const SEVERITY_STYLES: Record<string, string> = {
  WARNING: "text-amber-400",
  ERROR: "text-red-400",
  SUCCESS: "text-emerald-400",
  OPPORTUNITY: "text-blue-400",
  INFO: "text-slate-400",
};

export function RecentActivityPanel({ events }: RecentActivityPanelProps) {
  const { dict } = useSaasTranslations();
  const a = dict.controlCenter.activity;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{a.title}</h3>
          <p className="mt-1 text-xs text-slate-500">{a.subtitle}</p>
        </div>
        <Button
          render={<Link href="/app/timeline" />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className="gap-1 border-white/10 bg-transparent text-slate-200"
        >
          {a.openTimeline}
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <ControlEmptyState variant="no-activity" />
        ) : (
          events.map((event) => {
            const inner = (
              <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={
                      SEVERITY_STYLES[event.severity] ?? "text-slate-400"
                    }
                  >
                    {event.severity}
                  </span>
                  <span className="text-slate-500">{event.source}</span>
                  <span className="text-slate-600">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="mt-1 font-medium text-white">{event.title}</h4>
                {event.summary ? (
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                    {event.summary}
                  </p>
                ) : null}
              </div>
            );

            return event.href ? (
              <Link key={event.id} href={event.href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={event.id}>{inner}</div>
            );
          })
        )}
      </div>
    </section>
  );
}
