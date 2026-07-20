"use client";

import { Bot, CheckCircle2, CircleDashed, Gauge, MessageSquareText } from "lucide-react";

import type {
  AiVisibilityPlatform,
  AutopilotAiVisibilitySnapshot,
} from "@/lib/autopilot/ai-visibility-snapshot";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type AiVisibilitySnapshotCardProps = {
  snapshot: AutopilotAiVisibilitySnapshot;
};

type CoreAiPlatform = "CHATGPT" | "CLAUDE" | "PERPLEXITY" | "GEMINI";

const CORE_PLATFORMS: CoreAiPlatform[] = [
  "CHATGPT",
  "CLAUDE",
  "PERPLEXITY",
  "GEMINI",
];

function PlatformChip({
  platform,
  covered,
  label,
}: {
  platform: CoreAiPlatform;
  covered: boolean;
  label: string;
}) {
  return (
    <span
      className={
        covered
          ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
          : "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500"
      }
      title={platform}
    >
      {covered ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <CircleDashed className="size-3.5" />
      )}
      {label}
    </span>
  );
}

export function AiVisibilitySnapshotCard({
  snapshot,
}: AiVisibilitySnapshotCardProps) {
  const { dict } = useSaasTranslations();
  const t = dict.autopilot.aiVisibilitySnapshot;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <Bot className="size-3.5" />
            {t.eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {t.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            {t.description}
          </p>
        </div>
        <div className="grid min-w-[220px] grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">{t.readiness}</p>
            <p className="text-xl font-semibold text-slate-900">
              {snapshot.readinessScore === null
                ? t.notMeasured
                : `${snapshot.readinessScore}/100`}
            </p>
          </div>
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2">
            <p className="text-xs text-cyan-700">{t.buyerPrompts}</p>
            <p className="text-xl font-semibold text-slate-900">
              {snapshot.promptCount}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {CORE_PLATFORMS.map((platform) => (
          <PlatformChip
            key={platform}
            platform={platform}
            covered={snapshot.coverage[platform]}
            label={t.platforms[platform]}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MessageSquareText className="size-4 text-emerald-600" />
            {t.samplePrompts}
          </div>
          {snapshot.prompts.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {snapshot.prompts.slice(0, 3).map((prompt) => (
                <li key={prompt} className="rounded-lg bg-white px-3 py-2">
                  {prompt}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t.noPrompts}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Gauge className="size-4 text-cyan-600" />
            {t.statusTitle}
          </div>
          <p className="mt-3 text-sm font-medium text-slate-900">
            {t.statuses[snapshot.status]}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {snapshot.mentionAngles.length > 0
              ? snapshot.mentionAngles.slice(0, 2).join(" · ")
              : t.statusHelp}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {t.safetyNote}
      </p>
    </section>
  );
}
