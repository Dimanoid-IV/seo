export type {
  BrandVoiceConfidence,
  BrandVoiceFormality,
  BrandVoiceManualPatch,
  BrandVoicePageSample,
  BrandVoiceProfile,
  BrandVoiceSellingStyle,
  BrandVoiceTone,
} from "./types";
export {
  BRAND_VOICE_BUSINESS_GOALS_KEY,
  CONFIDENCE_THRESHOLD_HIGH,
  CONFIDENCE_THRESHOLD_MEDIUM,
} from "./types";
export {
  createDefaultBrandVoice,
  isBrandVoiceProfile,
} from "./default-voice";
export {
  extractBrandVoiceFromPages,
  extractBrandVoiceFromWebsite,
  parseBrandVoicePageSample,
} from "./extract-brand-voice";
export {
  buildBrandVoiceCtaGuidance,
  buildBrandVoiceGenerationInstructions,
  buildBrandVoiceHumanizerAddendum,
  ctaLooksRelevant,
  countGenericMarketingPhrases,
  GENERIC_MARKETING_PHRASE_PATTERNS,
} from "./prompt-instructions";
