/**
 * Brand Voice profile — how RankBoost should write for a website.
 * Persisted under Website.businessGoals.brandVoice (no DB migration).
 */

export type BrandVoiceFormality = "formal" | "neutral" | "informal";

export type BrandVoiceTone =
  | "friendly"
  | "expert"
  | "luxury"
  | "practical"
  | "artistic"
  | "warm";

export type BrandVoiceSellingStyle =
  | "soft"
  | "direct"
  | "consultative"
  | "gift-oriented";

export type BrandVoiceConfidence = "high" | "medium" | "low";

export type BrandVoiceProfile = {
  language: string;
  audience: string;
  tone: BrandVoiceTone;
  formality: BrandVoiceFormality;
  sellingStyle: BrandVoiceSellingStyle;
  commonPhrases: string[];
  forbiddenPhrases: string[];
  ctaStyle: string;
  examples: string[];
  confidence: BrandVoiceConfidence;
  sourceUrls: string[];
  updatedAt: string;
  /** Optional free-form notes from manual editor */
  manualNotes?: string;
  /** True when user overrode auto-extracted values */
  manuallyEdited?: boolean;
};

export type BrandVoiceManualPatch = {
  audience?: string;
  tone?: BrandVoiceTone;
  formality?: BrandVoiceFormality;
  sellingStyle?: BrandVoiceSellingStyle;
  commonPhrases?: string[];
  forbiddenPhrases?: string[];
  ctaStyle?: string;
  examples?: string[];
  manualNotes?: string;
  language?: string;
};

export type BrandVoicePageSample = {
  url: string;
  title: string;
  headings: string[];
  paragraphs: string[];
  ctaCandidates: string[];
};

export const BRAND_VOICE_BUSINESS_GOALS_KEY = "brandVoice" as const;

export const CONFIDENCE_THRESHOLD_HIGH = 0.65;
export const CONFIDENCE_THRESHOLD_MEDIUM = 0.35;
