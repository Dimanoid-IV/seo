import "server-only";

import { WebsiteStatus } from "@prisma/client";

import { findPrimaryOrganization } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

export async function resolveWebsiteForAutopilot(
  userId: string,
  organizationId: string | null,
  websiteId?: string | null
) {
  const prisma = getPrisma();

  let organization = organizationId
    ? await prisma.organization.findFirst({
        where: { id: organizationId, ownerUserId: userId, deletedAt: null },
      })
    : null;

  if (!organization) {
    organization = await findPrimaryOrganization(prisma, userId);
  }

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
  }

  const website = websiteId
    ? await prisma.website.findFirst({
        where: {
          id: websiteId,
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
      })
    : await prisma.website.findFirst({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
      });

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Add a website to generate your monthly growth plan.");
  }

  return { organization, website };
}

export async function findAutopilotPlanForUser(planId: string, userId: string) {
  const prisma = getPrisma();

  return prisma.monthlyAutopilotPlan.findFirst({
    where: {
      id: planId,
      userId,
      archivedAt: null,
    },
  });
}
