import "server-only";

import {
  Locale,
  OrganizationStatus,
  WebsiteLanguage,
  WebsiteStatus,
} from "@prisma/client";

import { findPrimaryOrganization } from "@/lib/auth/queries";
import { getCurrentSubscription } from "@/lib/billing/get-subscription";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { normalizeWebsiteUrl } from "@/lib/validators/auth";

function mapUserLocale(locale: Locale): WebsiteLanguage {
  switch (locale) {
    case Locale.ET:
      return WebsiteLanguage.ET;
    case Locale.EN:
      return WebsiteLanguage.EN;
    case Locale.RU:
    default:
      return WebsiteLanguage.RU;
  }
}

export async function createWebsiteForOnboarding(input: {
  userId: string;
  url: string;
  displayName?: string | null;
}) {
  const prisma = getPrisma();
  const organization = await findPrimaryOrganization(prisma, input.userId);

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
  }

  const websiteUrl = normalizeWebsiteUrl(input.url);

  const existingCount = await prisma.website.count({
    where: {
      organizationId: organization.id,
      deletedAt: null,
    },
  });

  const subscription = await getCurrentSubscription({
    userId: input.userId,
    organizationId: organization.id,
  });

  const websitesLimit = subscription.planLimit?.websitesLimit ?? 1;
  if (existingCount >= websitesLimit) {
    throw new AppError(
      ErrorCode.PLAN_LIMIT_EXCEEDED,
      "You've reached the website limit for your current plan. Upgrade to add more websites."
    );
  }

  const duplicate = await prisma.website.findFirst({
    where: {
      organizationId: organization.id,
      url: websiteUrl,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError(
      ErrorCode.CONFLICT,
      "This website is already in your workspace."
    );
  }

  const user = await prisma.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: { locale: true },
  });

  const website = await prisma.website.create({
    data: {
      organizationId: organization.id,
      url: websiteUrl,
      displayName:
        input.displayName?.trim() ||
        websiteUrl.replace(/^https?:\/\//, ""),
      primaryLanguage: user ? mapUserLocale(user.locale) : WebsiteLanguage.EN,
      contentLanguages: [],
      status: WebsiteStatus.ACTIVE,
    },
    select: {
      id: true,
      url: true,
      displayName: true,
      organizationId: true,
    },
  });

  if (organization.status !== OrganizationStatus.ACTIVE) {
    await prisma.organization.update({
      where: { id: organization.id },
      data: { status: OrganizationStatus.ACTIVE },
    });
  }

  return website;
}
