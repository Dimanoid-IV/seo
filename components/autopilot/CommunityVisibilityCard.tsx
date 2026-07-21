"use client";

import { ExternalLink, MessageSquareText, Search, ShieldCheck } from "lucide-react";

import type {
  CommunityVisibilityChannel,
  CommunityVisibilitySnapshot,
} from "@/lib/autopilot/community-visibility";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type CommunityVisibilityCardProps = {
  snapshot: CommunityVisibilitySnapshot;
};

function channelColor(channel: CommunityVisibilityChannel): string {
  if (channel === "REDDIT") return "border-orange-200 bg-orange-50 text-orange-800";
  if (channel === "QUORA") return "border-red-200 bg-red-50 text-red-800";
  return "border-cyan-200 bg-cyan-50 text-cyan-800";
}

export function CommunityVisibilityCard({
  snapshot,
}: CommunityVisibilityCardProps) {
  const { dict } = useSaasTranslations();
  const t = dict.autopilot.communityVisibility;

  return (
    <section className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-700">
            <MessageSquareText className="size-3.5" />
            {t.eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {t.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            {snapshot.hasEnoughSignal ? t.description : t.descriptionBasic}
          </p>
        </div>
        <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          <p className="font-semibold">{t.sourcesTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-cyan-800">
            {t.sourcesDescription(snapshot.sourceKeywords.length)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {snapshot.opportunities.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${channelColor(
                  item.channel
                )}`}
              >
                {t.channels[item.channel]}
              </span>
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Search className="size-3.5" />
                {t.searchQuery}
              </p>
              <p className="mt-1 break-words font-mono text-xs text-slate-800">
                {item.query}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {item.angle}
            </p>
            <a
              href={item.searchUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-50"
            >
              {t.openSearch}
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        ))}
      </div>

      <p className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>{t.safetyNote}</span>
      </p>
    </section>
  );
}
