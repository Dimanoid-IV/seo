export const GSC_WEB_URL = "https://search.google.com/search-console";

export type GscMatchConfidence = "high" | "medium" | "none";

export type RankedGscProperty<T extends { siteUrl: string }> = T & {
  matchConfidence: GscMatchConfidence;
  recommended: boolean;
};

/**
 * Normalizes a website URL or GSC property into a comparable hostname.
 * Handles sc-domain:, URL prefixes, www, trailing slashes, and paths.
 */
export function normalizeWebsiteDomain(input: string): string {
  const trimmed = input.trim().toLowerCase();

  if (trimmed.startsWith("sc-domain:")) {
    return trimmed.slice("sc-domain:".length).replace(/^www\./, "");
  }

  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .split("/")[0] ?? trimmed;
  }
}

function isDomainProperty(propertyUrl: string): boolean {
  return propertyUrl.trim().toLowerCase().startsWith("sc-domain:");
}

function hasUrlPath(propertyUrl: string): boolean {
  const trimmed = propertyUrl.trim().toLowerCase();
  if (trimmed.startsWith("sc-domain:")) {
    return false;
  }

  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const pathname = new URL(withProtocol).pathname;
    return pathname.length > 1;
  } catch {
    return false;
  }
}

/** Score how well a GSC property matches the RankBoost website URL. */
export function scoreGscPropertyMatch(
  propertyUrl: string,
  websiteUrl: string
): GscMatchConfidence {
  const propertyDomain = normalizeWebsiteDomain(propertyUrl);
  const websiteDomain = normalizeWebsiteDomain(websiteUrl);

  if (!propertyDomain || !websiteDomain || propertyDomain !== websiteDomain) {
    return "none";
  }

  if (isDomainProperty(propertyUrl) || !hasUrlPath(propertyUrl)) {
    return "high";
  }

  return "medium";
}

export function gscPropertyMatchesWebsite(
  propertyUrl: string,
  websiteUrl: string
): boolean {
  return scoreGscPropertyMatch(propertyUrl, websiteUrl) !== "none";
}

export function rankGscPropertiesForWebsite<T extends { siteUrl: string }>(
  sites: T[],
  websiteUrl: string
): RankedGscProperty<T>[] {
  const ranked = sites.map((site) => {
    const matchConfidence = scoreGscPropertyMatch(site.siteUrl, websiteUrl);
    return {
      ...site,
      matchConfidence,
      recommended: matchConfidence === "high",
    };
  });

  const order: Record<GscMatchConfidence, number> = {
    high: 0,
    medium: 1,
    none: 2,
  };

  return ranked.sort(
    (a, b) => order[a.matchConfidence] - order[b.matchConfidence]
  );
}

export function findMatchingGscProperty<
  T extends { siteUrl: string }
>(sites: T[], websiteUrl: string): T | null {
  const ranked = rankGscPropertiesForWebsite(sites, websiteUrl);
  return ranked.find((site) => site.matchConfidence !== "none") ?? null;
}

export function findHighConfidenceGscProperties<
  T extends { siteUrl: string }
>(sites: T[], websiteUrl: string): RankedGscProperty<T>[] {
  return rankGscPropertiesForWebsite(sites, websiteUrl).filter(
    (site) => site.matchConfidence === "high"
  );
}

export function hasMatchingGscProperty(
  sites: Array<{ siteUrl: string }>,
  websiteUrl: string
): boolean {
  return findMatchingGscProperty(sites, websiteUrl) != null;
}
