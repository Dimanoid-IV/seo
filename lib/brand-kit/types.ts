/**
 * Visual brand kit learned from a website.
 * Persisted under Website.businessGoals.brandKit (no DB migration).
 */

export type BrandKitConfidence = "high" | "medium" | "low";

export type BrandKitProfile = {
  palette: string[];
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  confidence: BrandKitConfidence;
  sourceUrls: string[];
  updatedAt: string;
};

export const BRAND_KIT_BUSINESS_GOALS_KEY = "brandKit" as const;

