import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { getSearchConsoleSites } from "@/lib/google/search-console";

import { resolveConnectedGscContext } from "./gsc-context";
import { withGscAccessToken } from "./gsc-access";

/**
 * Persists the selected Search Console property for the connected GSC integration.
 */
export async function selectGscSearchConsoleSite(
  currentUser: CurrentUser,
  siteUrl: string
) {
  const context = await resolveConnectedGscContext(currentUser);
  const trimmedSiteUrl = siteUrl.trim();

  if (!trimmedSiteUrl) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Укажите siteUrl");
  }

  const sites = await withGscAccessToken(
    context.integration.id,
    context.accessToken,
    (token) => getSearchConsoleSites(token)
  );
  const matchedSite = sites.find((site) => site.siteUrl === trimmedSiteUrl);

  if (!matchedSite) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Указанный сайт не найден в вашем Google Search Console",
      { details: { siteUrl: trimmedSiteUrl } }
    );
  }

  const prisma = getPrisma();
  const now = new Date();

  const googleData = await prisma.googleIntegrationData.upsert({
    where: { integrationId: context.integration.id },
    create: {
      integrationId: context.integration.id,
      searchConsoleSiteUrl: matchedSite.siteUrl,
      siteUrl: context.website.url,
      lastFetchedAt: null,
    },
    update: {
      searchConsoleSiteUrl: matchedSite.siteUrl,
      siteUrl: context.website.url,
      lastFetchedAt: null,
    },
    select: {
      searchConsoleSiteUrl: true,
      siteUrl: true,
    },
  });

  await prisma.integration.update({
    where: { id: context.integration.id },
    data: { lastSuccessAt: now },
  });

  return {
    siteUrl: matchedSite.siteUrl,
    permissionLevel: matchedSite.permissionLevel,
    websiteUrl: googleData.siteUrl,
    selectedAt: now.toISOString(),
  };
}
