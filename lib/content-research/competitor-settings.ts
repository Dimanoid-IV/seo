import "server-only";

import type { Prisma } from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import {
  normalizeManualCompetitors,
  readManualCompetitorsFromBusinessGoals,
  writeManualCompetitorsIntoBusinessGoals,
  type ManualCompetitor,
} from "./competitors";

async function resolveOwnedWebsite(input: {
  currentUser: CurrentUser;
  websiteId?: string | null;
}) {
  const prisma = getPrisma();
  const organization = await resolveOwnedOrganization(
    prisma,
    input.currentUser.id,
    input.currentUser.organizationId
  );

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Organization not found.");
  }

  const website = await prisma.website.findFirst({
    where: {
      id: input.websiteId ?? undefined,
      organizationId: organization.id,
      deletedAt: null,
    },
    select: {
      id: true,
      url: true,
      businessGoals: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Website not found.");
  }

  return website;
}

export async function getCompetitorSettingsForUser(input: {
  currentUser: CurrentUser;
  websiteId?: string | null;
}): Promise<{ websiteId: string; competitors: ManualCompetitor[] }> {
  const website = await resolveOwnedWebsite(input);
  return {
    websiteId: website.id,
    competitors: readManualCompetitorsFromBusinessGoals(website.businessGoals),
  };
}

export async function updateCompetitorSettingsForUser(input: {
  currentUser: CurrentUser;
  websiteId?: string | null;
  competitors: string[];
}): Promise<{ websiteId: string; competitors: ManualCompetitor[] }> {
  const prisma = getPrisma();
  const website = await resolveOwnedWebsite(input);
  const competitors = normalizeManualCompetitors({
    competitors: input.competitors,
    websiteUrl: website.url,
  });

  const businessGoals = writeManualCompetitorsIntoBusinessGoals(
    website.businessGoals,
    competitors
  );

  await prisma.website.update({
    where: { id: website.id },
    data: { businessGoals: businessGoals as Prisma.InputJsonValue },
  });

  return {
    websiteId: website.id,
    competitors,
  };
}
