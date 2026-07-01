import "server-only";

import { WebsiteStatus } from "@prisma/client";

import { findPrimaryOrganization } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

export async function resolveWebsiteForControlCenter(
  userId: string,
  organizationId: string | null,
  websiteId?: string | null
) {
  const prisma = getPrisma();

  let organization = organizationId
    ? await prisma.organization.findFirst({
        where: { id: organizationId, ownerUserId: userId, deletedAt: null },
        select: { id: true },
      })
    : null;

  if (!organization) {
    organization = await findPrimaryOrganization(prisma, userId);
  }

  if (!organization) {
    return null;
  }

  const website = websiteId
    ? await prisma.website.findFirst({
        where: {
          id: websiteId,
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        select: {
          id: true,
          url: true,
          displayName: true,
          organizationId: true,
          currentGrowthScore: true,
          lastAuditAt: true,
        },
      })
    : await prisma.website.findFirst({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          url: true,
          displayName: true,
          organizationId: true,
          currentGrowthScore: true,
          lastAuditAt: true,
        },
      });

  if (!website) {
    return null;
  }

  return { organization, website };
}

export async function requireWebsiteForControlCenter(
  userId: string,
  organizationId: string | null,
  websiteId?: string | null
) {
  const resolved = await resolveWebsiteForControlCenter(
    userId,
    organizationId,
    websiteId
  );

  if (!resolved) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Add a website to use Autopilot Control Center."
    );
  }

  return resolved;
}
