import "server-only";

import { Prisma, WebsiteStatus } from "@prisma/client";

import { getPrisma } from "@/lib/db";

import {
  readBrandKitFromBusinessGoals,
  writeBrandKitIntoBusinessGoals,
} from "./business-goals";
import type { BrandKitProfile } from "./types";

export async function saveWebsiteBrandKit(input: {
  websiteId: string;
  organizationId: string;
  profile: BrandKitProfile;
}): Promise<BrandKitProfile> {
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

  const nextGoals = writeBrandKitIntoBusinessGoals(
    website.businessGoals,
    input.profile
  );

  await prisma.website.update({
    where: { id: website.id },
    data: { businessGoals: nextGoals as Prisma.InputJsonValue },
  });

  return input.profile;
}

export async function loadBrandKitForWebsite(
  websiteId: string
): Promise<BrandKitProfile | null> {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: { id: websiteId, deletedAt: null },
    select: { businessGoals: true },
  });
  if (!website) return null;
  return readBrandKitFromBusinessGoals(website.businessGoals);
}

