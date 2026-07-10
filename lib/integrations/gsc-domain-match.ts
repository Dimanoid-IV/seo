export const GSC_WEB_URL = "https://search.google.com/search-console";

/**
 * Normalizes a website URL or GSC property into a comparable hostname.
 * Handles sc-domain:, URL prefixes, and www.
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

export function gscPropertyMatchesWebsite(
  propertyUrl: string,
  websiteUrl: string
): boolean {
  return (
    normalizeWebsiteDomain(propertyUrl) === normalizeWebsiteDomain(websiteUrl)
  );
}

export function findMatchingGscProperty<
  T extends { siteUrl: string }
>(sites: T[], websiteUrl: string): T | null {
  return (
    sites.find((site) => gscPropertyMatchesWebsite(site.siteUrl, websiteUrl)) ??
    null
  );
}

export function hasMatchingGscProperty(
  sites: Array<{ siteUrl: string }>,
  websiteUrl: string
): boolean {
  return findMatchingGscProperty(sites, websiteUrl) != null;
}
