import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getSearchConsoleSites } from "@/lib/google/search-console";
import { resolveConnectedGscContext } from "@/lib/integrations/gsc-context";
import {
  findHighConfidenceGscProperties,
  hasMatchingGscProperty,
  normalizeWebsiteDomain,
  rankGscPropertiesForWebsite,
} from "@/lib/integrations/gsc-domain-match";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const context = await resolveConnectedGscContext(currentUser);
    const { withGscAccessToken } = await import("@/lib/integrations/gsc-access");
    const sites = await withGscAccessToken(
      context.integration.id,
      context.accessToken,
      (token) => getSearchConsoleSites(token)
    );

    const websiteUrl = context.website.url;
    const rankedSites = rankGscPropertiesForWebsite(sites, websiteUrl);
    const highConfidence = findHighConfidenceGscProperties(sites, websiteUrl);
    const matchingSite = rankedSites.find((site) => site.matchConfidence !== "none");

    return authJsonResponse({
      data: {
        sites: rankedSites,
        selectedSiteUrl: context.selectedSiteUrl,
        websiteUrl,
        websiteDomain: normalizeWebsiteDomain(websiteUrl),
        hasMatchingProperty: hasMatchingGscProperty(sites, websiteUrl),
        matchingSiteUrl: matchingSite?.siteUrl ?? null,
        highConfidenceCount: highConfidence.length,
        autoSelectCandidateUrl:
          highConfidence.length === 1 ? highConfidence[0]!.siteUrl : null,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
