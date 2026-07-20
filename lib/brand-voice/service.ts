import "server-only";

import { WebsiteStatus } from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  extractBrandKitFromWebsite,
  loadBrandKitForWebsite,
  saveWebsiteBrandKit,
  type BrandKitProfile,
} from "@/lib/brand-kit";

import { createDefaultBrandVoice } from "./default-voice";
import { extractBrandVoiceFromWebsite } from "./extract-brand-voice";
import {
  applyManualBrandVoicePatch,
  getWebsiteBrandVoice,
  readBrandVoiceFromBusinessGoals,
  saveWebsiteBrandVoice,
} from "./persist";
import type { BrandVoiceManualPatch, BrandVoiceProfile } from "./types";

async function resolveActiveWebsite(
  currentUser: CurrentUser,
  websiteId?: string | null
) {
  const prisma = getPrisma();
  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
  }

  const website = await prisma.website.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
      ...(websiteId ? { id: websiteId } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      primaryLanguage: true,
      businessGoals: true,
      displayName: true,
    },
  });

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Website not found");
  }

  return { organization, website };
}

export async function getBrandVoiceForUser(
  currentUser: CurrentUser,
  websiteId?: string | null
): Promise<{
  profile: BrandVoiceProfile;
  brandKit: BrandKitProfile | null;
  website: { id: string; url: string; displayName: string | null };
  hasStoredProfile: boolean;
}> {
  const { website } = await resolveActiveWebsite(
    currentUser,
    websiteId
  );

  const stored = readBrandVoiceFromBusinessGoals(website.businessGoals);
  const profile =
    stored ??
    createDefaultBrandVoice({
      language: website.primaryLanguage.toLowerCase(),
      sourceUrls: [website.url],
    });

  return {
    profile,
    brandKit: await loadBrandKitForWebsite(website.id),
    website: {
      id: website.id,
      url: website.url,
      displayName: website.displayName,
    },
    hasStoredProfile: Boolean(stored),
  };
}

export async function refreshBrandVoiceForUser(
  currentUser: CurrentUser,
  websiteId?: string | null
): Promise<{ profile: BrandVoiceProfile; brandKit: BrandKitProfile | null }> {
  const { organization, website } = await resolveActiveWebsite(
    currentUser,
    websiteId
  );

  const [extracted, brandKit] = await Promise.all([
    extractBrandVoiceFromWebsite({
      websiteUrl: website.url,
      language: website.primaryLanguage.toLowerCase(),
    }),
    extractBrandKitFromWebsite({ websiteUrl: website.url }).catch(() => null),
  ]);

  const profile = await saveWebsiteBrandVoice({
    websiteId: website.id,
    organizationId: organization.id,
    profile: extracted,
  });

  if (brandKit) {
    await saveWebsiteBrandKit({
      websiteId: website.id,
      organizationId: organization.id,
      profile: brandKit,
    });
  }

  return { profile, brandKit };
}

export async function updateBrandVoiceForUser(
  currentUser: CurrentUser,
  patch: BrandVoiceManualPatch,
  websiteId?: string | null
): Promise<BrandVoiceProfile> {
  const { organization, website } = await resolveActiveWebsite(
    currentUser,
    websiteId
  );

  const existing =
    (await getWebsiteBrandVoice(website.id, organization.id))?.profile ??
    createDefaultBrandVoice({
      language: website.primaryLanguage.toLowerCase(),
      sourceUrls: [website.url],
    });

  const next = applyManualBrandVoicePatch(existing, patch);
  return saveWebsiteBrandVoice({
    websiteId: website.id,
    organizationId: organization.id,
    profile: next,
  });
}
