import { WebsiteStatus } from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { sortGrowthOpportunities } from "./opportunities";
import { syncGrowthOpportunitiesForWebsite } from "./sync-opportunities";
import type { GrowthOpportunitiesResponse } from "./types";

/**
 * Loads growth opportunities for the authenticated user's primary website.
 */
export async function getGrowthOpportunitiesForUser(
  currentUser: CurrentUser
): Promise<GrowthOpportunitiesResponse> {
  const prisma = getPrisma();

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Организация не найдена");
  }

  const website = await prisma.website.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Добавьте сайт, чтобы увидеть возможности роста");
  }

  const opportunities = await syncGrowthOpportunitiesForWebsite({
    websiteId: website.id,
    organizationId: organization.id,
    userId: currentUser.id,
  });

  const sorted = sortGrowthOpportunities(opportunities);

  return {
    data: {
      websiteId: website.id,
      opportunities: sorted,
      total: sorted.length,
    },
  };
}
