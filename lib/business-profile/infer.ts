export type BusinessPageEvidence = {
  url: string;
  pageType: string;
  title: string | null;
  description: string | null;
  h1: string | null;
  locale: string | null;
  schema: unknown;
};

export type InferredBusinessProfile = {
  businessName: string | null;
  description: string | null;
  niche: string | null;
  country: string | null;
  targetMarkets: string[];
  languages: string[];
  services: Array<{ name: string; url: string }>;
  products: Array<{ name: string; url: string }>;
  conversionPages: Array<{ type: string; url: string }>;
  commercialIntent: string | null;
  evidence: Array<{ field: string; url: string; source: string }>;
  confidence: number;
};

function cleanTitle(title: string | null): string | null {
  if (!title) return null;
  return title.split(/\s+[|–—-]\s+/)[0]?.trim() || null;
}

function collectSchemaNames(node: unknown, result: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((item) => collectSchemaNames(item, result));
    return result;
  }
  if (!node || typeof node !== "object") return result;
  const record = node as Record<string, unknown>;
  const type = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]];
  if (type.some((value) => ["Organization", "LocalBusiness", "Store", "Corporation"].includes(String(value)))) {
    if (typeof record.name === "string" && record.name.trim()) result.push(record.name.trim());
  }
  Object.values(record).forEach((value) => collectSchemaNames(value, result));
  return result;
}

export function inferBusinessProfile(input: {
  siteUrl: string;
  displayName?: string | null;
  configuredCountry?: string | null;
  configuredNiche?: string | null;
  primaryLanguage?: string | null;
  pages: BusinessPageEvidence[];
}): InferredBusinessProfile {
  const home = input.pages.find((page) => page.pageType === "HOME") ?? input.pages[0];
  const schemaNames = input.pages.flatMap((page) => collectSchemaNames(page.schema));
  const businessName = input.displayName?.trim() || schemaNames[0] || cleanTitle(home?.title ?? null);
  const languages = [...new Set([
    ...(input.primaryLanguage ? [input.primaryLanguage.toLowerCase()] : []),
    ...input.pages.map((page) => page.locale?.split("-")[0]?.toLowerCase()).filter((locale): locale is string => Boolean(locale)),
  ])];
  const host = new URL(input.siteUrl).hostname;
  const inferredCountry = host.endsWith(".ee") ? "EE" : null;
  const country = input.configuredCountry?.toUpperCase() || inferredCountry;
  const servicePages = input.pages.filter((page) => page.pageType === "SERVICE");
  const productPages = input.pages.filter((page) => page.pageType === "PRODUCT");
  const conversionPages = input.pages
    .filter((page) => ["PRODUCT", "SERVICE", "CONTACT", "CATEGORY"].includes(page.pageType))
    .map((page) => ({ type: page.pageType, url: page.url }));
  const evidence = [
    ...(home ? [{ field: "description", url: home.url, source: "homepage_metadata" }] : []),
    ...servicePages.map((page) => ({ field: "services", url: page.url, source: "crawl_page_type" })),
    ...productPages.map((page) => ({ field: "products", url: page.url, source: "crawl_page_type" })),
  ];
  const completeness = [businessName, home?.description, country, languages.length, conversionPages.length]
    .filter(Boolean).length / 5;

  return {
    businessName: businessName ?? null,
    description: home?.description ?? home?.h1 ?? null,
    niche: input.configuredNiche ?? null,
    country,
    targetMarkets: country ? [country] : [],
    languages,
    services: servicePages.map((page) => ({ name: page.h1 || cleanTitle(page.title) || page.url, url: page.url })),
    products: productPages.map((page) => ({ name: page.h1 || cleanTitle(page.title) || page.url, url: page.url })),
    conversionPages,
    commercialIntent: conversionPages.length > 0 ? "convert visitors through product/service pages" : null,
    evidence,
    confidence: Math.round((0.35 + completeness * 0.6) * 100) / 100,
  };
}
