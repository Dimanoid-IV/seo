import type { BrandVoiceProfile } from "./types";
import { createDefaultBrandVoice } from "./default-voice";

/**
 * Turns a BrandVoiceProfile into Hermes generation / humanizer instructions.
 */
export function buildBrandVoiceGenerationInstructions(
  profile: BrandVoiceProfile | null | undefined,
  languageFallback = "ru"
): string[] {
  const voice =
    profile ?? createDefaultBrandVoice({ language: languageFallback });
  const lowConfidence = voice.confidence === "low";

  const lines: string[] = [
    "=== BRAND VOICE CONSTRAINTS ===",
    `Write in language: ${voice.language}. Do not switch languages.`,
    `Audience: ${voice.audience}`,
    `Tone: ${voice.tone}; formality: ${voice.formality}; selling style: ${voice.sellingStyle}.`,
    `CTA style: ${voice.ctaStyle}`,
    lowConfidence
      ? "Confidence is low — use a clear, helpful, practical, non-hype, small-business-friendly style. Avoid generic AI marketing fluff."
      : "Match the brand voice closely so the article feels like this business wrote it — not a generic AI blog.",
    "Avoid generic AI style: no 'as an AI', no 'in today's digital landscape', no empty hype, no guaranteed rankings.",
  ];

  if (voice.commonPhrases.length > 0) {
    lines.push(
      `Prefer natural phrases from the brand when fitting: ${voice.commonPhrases.slice(0, 6).join("; ")}`
    );
  }

  if (voice.forbiddenPhrases.length > 0) {
    lines.push(
      `Never use these phrases: ${voice.forbiddenPhrases.slice(0, 8).join("; ")}`
    );
  }

  if (voice.examples.length > 0) {
    lines.push(
      "Match the rhythm and word choice of these brand examples:",
      ...voice.examples.slice(0, 2).map((ex) => `Example: "${ex.slice(0, 280)}"`)
    );
  }

  if (voice.manualNotes?.trim()) {
    lines.push(`Editor notes: ${voice.manualNotes.trim()}`);
  }

  lines.push("=== END BRAND VOICE ===");
  return lines;
}

export function buildBrandVoiceHumanizerAddendum(
  profile: BrandVoiceProfile | null | undefined,
  languageFallback = "ru"
): string {
  return buildBrandVoiceGenerationInstructions(profile, languageFallback).join(
    "\n"
  );
}

/**
 * CTA guidance string for Hermes constraints, grounded in brand voice.
 */
export function buildBrandVoiceCtaGuidance(
  profile: BrandVoiceProfile | null | undefined,
  topic: string,
  websiteUrl: string
): string {
  const voice = profile;
  const cta =
    voice?.ctaStyle?.trim() ||
    "natural, non-aggressive call-to-action inviting the reader to contact the business";

  return `End with a call-to-action matching this brand CTA style: ${cta}. Invite the reader regarding "${topic}" or contact via ${websiteUrl}. No pressure, no fake urgency, no ranking guarantees.`;
}

/**
 * Optional quality-gate helpers: detect overused generic marketing fluff beyond AI-assistant phrases.
 */
export const GENERIC_MARKETING_PHRASE_PATTERNS: RegExp[] = [
  /\bin today's digital landscape\b/i,
  /\bunlock the power\b/i,
  /\bgame[- ]?changer\b/i,
  /\bleverage\b/i,
  /\bcutting[- ]?edge\b/i,
  /\bна сегодняшний день\b/i,
  /\bраскройте потенциал\b/i,
  /\bреволюционн\w*\b/i,
];

export function countGenericMarketingPhrases(text: string): number {
  return GENERIC_MARKETING_PHRASE_PATTERNS.filter((p) => p.test(text)).length;
}

export function ctaLooksRelevant(
  contentHtml: string,
  ctaStyle: string | undefined
): boolean {
  if (!ctaStyle?.trim()) return true;
  const plain = contentHtml.replace(/<[^>]+>/g, " ").toLowerCase();
  const tokens = ctaStyle
    .toLowerCase()
    .split(/[^a-zа-яё0-9]+/i)
    .filter((t) => t.length >= 4)
    .slice(0, 6);
  if (tokens.length === 0) return true;
  const hits = tokens.filter((t) => plain.includes(t)).length;
  return hits >= 1;
}
