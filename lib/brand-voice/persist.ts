import "server-only";

import { Prisma, WebsiteStatus } from "@prisma/client";

import { getPrisma } from "@/lib/db";

import {
  readBrandVoiceFromBusinessGoals,
  writeBrandVoiceIntoBusinessGoals,
} from "./business-goals";
import { isBrandVoiceProfile } from "./default-voice";
import type { BrandVoiceManualPatch, BrandVoiceProfile } from "./types";

export {
  readBrandVoiceFromBusinessGoals,
  writeBrandVoiceIntoBusinessGoals,
} from "./business-goals";

export function applyManualBrandVoicePatch(
  current: BrandVoiceProfile,
  patch: BrandVoiceManualPatch
): BrandVoiceProfile {
  return {
    ...current,
    audience: patch.audience?.trim() || current.audience,
    tone: patch.tone ?? current.tone,
    formality: patch.formality ?? current.formality,
    sellingStyle: patch.sellingStyle ?? current.sellingStyle,
    commonPhrases: patch.commonPhrases ?? current.commonPhrases,
    forbiddenPhrases: patch.forbiddenPhrases ?? current.forbiddenPhrases,
    ctaStyle: patch.ctaStyle?.trim() || current.ctaStyle,
    examples: patch.examples ?? current.examples,
    language: patch.language?.trim() || current.language,
    manualNotes: patch.manualNotes?.trim() || current.manualNotes,
    manuallyEdited: true,
    updatedAt: new Date().toISOString(),
  };
}

export async function getWebsiteBrandVoice(
  websiteId: string,
  organizationId: string
): Promise<{
  profile: BrandVoiceProfile | null;
  website: { id: string; url: string; primaryLanguage: string };
} | null> {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      organizationId,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    select: {
      id: true,
      url: true,
      primaryLanguage: true,
      businessGoals: true,
    },
  });

  if (!website) return null;

  return {
    profile: readBrandVoiceFromBusinessGoals(website.businessGoals),
    website: {
      id: website.id,
      url: website.url,
      primaryLanguage: website.primaryLanguage.toLowerCase(),
    },
  };
}

export async function saveWebsiteBrandVoice(input: {
  websiteId: string;
  organizationId: string;
  profile: BrandVoiceProfile;
}): Promise<BrandVoiceProfile> {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: {
      id: input.websiteId,
      organizationId: input.organizationId,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    select: { id: true, businessGoals: true },
  });

  if (!website) {
    throw new Error("Website not found");
  }

  const nextGoals = writeBrandVoiceIntoBusinessGoals(
    website.businessGoals,
    input.profile
  );

  await prisma.website.update({
    where: { id: website.id },
    data: {
      businessGoals: nextGoals as Prisma.InputJsonValue,
    },
  });

  return input.profile;
}

/**
 * Loads brand voice for generation; returns null if website missing.
 * Does not auto-extract (avoids generation storms) — callers use default if null.
 */
export async function loadBrandVoiceForWebsite(
  websiteId: string
): Promise<BrandVoiceProfile | null> {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: { id: websiteId, deletedAt: null },
    select: { businessGoals: true },
  });
  if (!website) return null;
  return readBrandVoiceFromBusinessGoals(website.businessGoals);
}

// Keep type guard re-export for callers that imported from persist.
export { isBrandVoiceProfile };
