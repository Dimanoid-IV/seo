import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getSearchConsoleSites } from "@/lib/google/search-console";
import { resolveConnectedGscContext } from "@/lib/integrations/gsc-context";
import {
  findMatchingGscProperty,
  hasMatchingGscProperty,
  normalizeWebsiteDomain,
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
    const matchingSite = findMatchingGscProperty(sites, websiteUrl);

    return authJsonResponse({
      data: {
        sites,
        selectedSiteUrl: context.selectedSiteUrl,
        websiteUrl,
        websiteDomain: normalizeWebsiteDomain(websiteUrl),
        hasMatchingProperty: hasMatchingGscProperty(sites, websiteUrl),
        matchingSiteUrl: matchingSite?.siteUrl ?? null,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
