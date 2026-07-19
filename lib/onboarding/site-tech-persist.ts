import { Prisma } from "@prisma/client";

import type { SiteTechDetection } from "@/lib/site-tech/detect-site-tech";

import { SITE_TECH_BUSINESS_GOALS_KEY } from "./activation-types";

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

export function readSiteTechFromBusinessGoals(
  businessGoals: unknown
): SiteTechDetection | null {
  const bag = asGoalsBag(businessGoals);
  const raw = bag[SITE_TECH_BUSINESS_GOALS_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const detection = raw as SiteTechDetection;
  if (typeof detection.platform !== "string") return null;
  return detection;
}

export function writeSiteTechIntoBusinessGoals(
  businessGoals: unknown,
  detection: SiteTechDetection
): BusinessGoalsBag {
  const bag = asGoalsBag(businessGoals);
  return {
    ...bag,
    [SITE_TECH_BUSINESS_GOALS_KEY]: {
      ...detection,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function siteTechAsInputJson(
  businessGoals: unknown,
  detection: SiteTechDetection
): Prisma.InputJsonValue {
  return writeSiteTechIntoBusinessGoals(
    businessGoals,
    detection
  ) as Prisma.InputJsonValue;
}
