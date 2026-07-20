import type { BrandKitProfile } from "./types";
import { BRAND_KIT_BUSINESS_GOALS_KEY } from "./types";

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

export function isBrandKitProfile(value: unknown): value is BrandKitProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.palette) &&
    record.palette.every((color) => typeof color === "string") &&
    (typeof record.primaryColor === "string" || record.primaryColor === null) &&
    (typeof record.secondaryColor === "string" || record.secondaryColor === null) &&
    (typeof record.accentColor === "string" || record.accentColor === null) &&
    typeof record.confidence === "string" &&
    Array.isArray(record.sourceUrls) &&
    typeof record.updatedAt === "string"
  );
}

export function readBrandKitFromBusinessGoals(
  businessGoals: unknown
): BrandKitProfile | null {
  const bag = asGoalsBag(businessGoals);
  const raw = bag[BRAND_KIT_BUSINESS_GOALS_KEY];
  return isBrandKitProfile(raw) ? raw : null;
}

export function writeBrandKitIntoBusinessGoals(
  businessGoals: unknown,
  profile: BrandKitProfile
): BusinessGoalsBag {
  const bag = asGoalsBag(businessGoals);
  return {
    ...bag,
    [BRAND_KIT_BUSINESS_GOALS_KEY]: profile,
  };
}

