"use client";

import { useState } from "react";

import type {
  BrandVoiceManualPatch,
  BrandVoiceProfile,
  BrandVoiceTone,
} from "@/lib/brand-voice/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

const TONE_OPTIONS: BrandVoiceTone[] = [
  "friendly",
  "expert",
  "luxury",
  "practical",
  "artistic",
  "warm",
];

type BrandVoiceEditorProps = {
  profile: BrandVoiceProfile;
  busy: boolean;
  onCancel: () => void;
  onSave: (patch: BrandVoiceManualPatch) => void;
};

function listToLines(items: string[]): string {
  return items.join("\n");
}

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function BrandVoiceEditor({
  profile,
  busy,
  onCancel,
  onSave,
}: BrandVoiceEditorProps) {
  const { dict } = useSaasTranslations();
  const t = dict.integrations.brandVoice;

  const [audience, setAudience] = useState(profile.audience);
  const [tone, setTone] = useState<BrandVoiceTone>(profile.tone);
  const [commonPhrases, setCommonPhrases] = useState(
    listToLines(profile.commonPhrases)
  );
  const [forbiddenPhrases, setForbiddenPhrases] = useState(
    listToLines(profile.forbiddenPhrases)
  );
  const [ctaStyle, setCtaStyle] = useState(profile.ctaStyle);
  const [example, setExample] = useState(profile.examples[0] ?? "");

  return (
    <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-medium text-slate-900">{t.editorTitle}</p>

      <label className="block text-xs font-medium text-slate-600">
        {t.fieldAudience}
        <textarea
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>

      <label className="block text-xs font-medium text-slate-600">
        {t.fieldTone}
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as BrandVoiceTone)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        >
          {TONE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t.tones[option] ?? option}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium text-slate-600">
        {t.fieldWordsToUse}
        <textarea
          value={commonPhrases}
          onChange={(e) => setCommonPhrases(e.target.value)}
          rows={3}
          placeholder={t.wordsPlaceholder}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>

      <label className="block text-xs font-medium text-slate-600">
        {t.fieldWordsToAvoid}
        <textarea
          value={forbiddenPhrases}
          onChange={(e) => setForbiddenPhrases(e.target.value)}
          rows={3}
          placeholder={t.wordsPlaceholder}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>

      <label className="block text-xs font-medium text-slate-600">
        {t.fieldCta}
        <textarea
          value={ctaStyle}
          onChange={(e) => setCtaStyle(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>

      <label className="block text-xs font-medium text-slate-600">
        {t.fieldExample}
        <textarea
          value={example}
          onChange={(e) => setExample(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onSave({
              audience,
              tone,
              commonPhrases: linesToList(commonPhrases),
              forbiddenPhrases: linesToList(forbiddenPhrases),
              ctaStyle,
              examples: example.trim() ? [example.trim()] : [],
            })
          }
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {t.save}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
