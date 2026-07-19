import type { BrandVoiceProfile } from "./types";

/**
 * Conservative default when site copy is thin or unreachable.
 */
export function createDefaultBrandVoice(input: {
  language: string;
  sourceUrls?: string[];
}): BrandVoiceProfile {
  return {
    language: input.language || "ru",
    audience: "Owners and customers of a small local business",
    tone: "practical",
    formality: "neutral",
    sellingStyle: "soft",
    commonPhrases: [],
    forbiddenPhrases: [
      "guaranteed rankings",
      "as an AI",
      "in today's digital landscape",
      "unlock the power",
      "game-changer",
      "гарантируем позиции",
      "как искусственный интеллект",
      "на сегодняшний день",
    ],
    ctaStyle:
      "Clear, helpful, non-hype invitation to contact or request a service",
    examples: [],
    confidence: "low",
    sourceUrls: input.sourceUrls ?? [],
    updatedAt: new Date().toISOString(),
  };
}

export function isBrandVoiceProfile(value: unknown): value is BrandVoiceProfile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.language === "string" &&
    typeof v.audience === "string" &&
    typeof v.tone === "string" &&
    typeof v.formality === "string" &&
    typeof v.sellingStyle === "string" &&
    Array.isArray(v.commonPhrases) &&
    Array.isArray(v.forbiddenPhrases) &&
    typeof v.ctaStyle === "string" &&
    Array.isArray(v.examples) &&
    typeof v.confidence === "string" &&
    Array.isArray(v.sourceUrls) &&
    typeof v.updatedAt === "string"
  );
}
