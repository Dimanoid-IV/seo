import { isBrandVoiceProfile } from "./default-voice";
import type { BrandVoiceProfile } from "./types";
import { BRAND_VOICE_BUSINESS_GOALS_KEY } from "./types";

type BusinessGoalsBag = Record<string, unknown>;

function asGoalsBag(value: unknown): BusinessGoalsBag {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as BusinessGoalsBag) };
  }
  if (Array.isArray(value)) {
    return { goals: value };
  }
  return {};
}

export function readBrandVoiceFromBusinessGoals(
  businessGoals: unknown
): BrandVoiceProfile | null {
  const bag = asGoalsBag(businessGoals);
  const raw = bag[BRAND_VOICE_BUSINESS_GOALS_KEY];
  return isBrandVoiceProfile(raw) ? raw : null;
}

export function writeBrandVoiceIntoBusinessGoals(
  businessGoals: unknown,
  profile: BrandVoiceProfile
): BusinessGoalsBag {
  const bag = asGoalsBag(businessGoals);
  return {
    ...bag,
    [BRAND_VOICE_BUSINESS_GOALS_KEY]: profile,
  };
}
