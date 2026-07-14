import "server-only";

import type { CurrentUser } from "@/lib/auth/types";
import { getSearchConsoleSites } from "@/lib/google/search-console";

import { withGscAccessToken } from "./gsc-access";
import { resolveConnectedGscContext } from "./gsc-context";
import { findHighConfidenceGscProperties } from "./gsc-domain-match";
import { selectGscSearchConsoleSite } from "./gsc-property";
import { syncGscPerformanceForWebsite } from "./gsc-sync";

export type GscAutoConnectResult = {
  autoSelected: boolean;
  selectedSiteUrl?: string;
  syncTriggered: boolean;
  highConfidenceCount: number;
  syncError?: boolean;
};

/**
 * Attempts to auto-select a GSC property when exactly one high-confidence match exists.
 */
export async function tryAutoConnectGscProperty(input: {
  currentUser: CurrentUser;
  triggerSync?: boolean;
}): Promise<GscAutoConnectResult> {
  const context = await resolveConnectedGscContext(input.currentUser);

  if (context.selectedSiteUrl) {
    return {
      autoSelected: false,
      selectedSiteUrl: context.selectedSiteUrl,
      syncTriggered: false,
      highConfidenceCount: 0,
    };
  }

  const sites = await withGscAccessToken(
    context.integration.id,
    context.accessToken,
    (token) => getSearchConsoleSites(token)
  );

  const highMatches = findHighConfidenceGscProperties(
    sites,
    context.website.url
  );

  if (highMatches.length !== 1) {
    return {
      autoSelected: false,
      syncTriggered: false,
      highConfidenceCount: highMatches.length,
    };
  }

  const selectedSiteUrl = highMatches[0]!.siteUrl;

  await selectGscSearchConsoleSite(input.currentUser, selectedSiteUrl, {
    confirmMismatch: false,
  });

  let syncTriggered = false;
  let syncError = false;

  if (input.triggerSync) {
    try {
      await syncGscPerformanceForWebsite({
        websiteId: context.website.id,
        userId: input.currentUser.id,
      });
      syncTriggered = true;
    } catch {
      syncError = true;
    }
  }

  return {
    autoSelected: true,
    selectedSiteUrl,
    syncTriggered,
    highConfidenceCount: 1,
    syncError,
  };
}
