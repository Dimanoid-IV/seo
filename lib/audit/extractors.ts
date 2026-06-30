import type { CheerioAPI } from "cheerio";

import {
  isBrokenLinkHref,
  isInternalUrl,
  normalizeWhitespace,
  parseHtml,
  resolveDocumentUrl,
  toTextFieldStat,
} from "./parser";
import type { OnPageSeoData, SchemaStat } from "./onpage-types";

const MAX_HEADING_SAMPLES = 50;
const TEXT_SAMPLE_LIMIT = 1000;

const ORGANIZATION_TYPES = new Set([
  "Organization",
  "Corporation",
  "LocalBusiness",
  "NGO",
  "SportsOrganization",
  "MedicalOrganization",
]);

const LOCAL_BUSINESS_TYPES = new Set([
  "LocalBusiness",
  "Restaurant",
  "Store",
  "HealthAndBeautyBusiness",
  "ProfessionalService",
  "HomeAndConstructionBusiness",
  "LegalService",
  "FinancialService",
  "MedicalBusiness",
  "LodgingBusiness",
  "FoodEstablishment",
]);

/**
 * Extracts on-page SEO facts from HTML using Cheerio.
 * Pure function — no network, database, or AI calls.
 *
 * @param html - Raw HTML from {@link scanWebsite}
 * @param finalUrl - Final URL after redirects
 */
export function extractOnPageSeo(html: string, finalUrl: string): OnPageSeoData {
  const { root, baseUrl } = parseHtml(html, finalUrl);
  const pageOrigin = new URL(finalUrl).origin;

  const title = extractTitle(root);
  const metaDescription = extractMetaDescription(root);
  const h1 = extractHeadings(root, "h1");
  const h2 = extractHeadings(root, "h2");
  const canonical = extractCanonical(root, baseUrl);
  const robotsMeta = extractRobotsMeta(root);
  const openGraph = extractOpenGraph(root);
  const twitterCard = extractTwitterCard(root);
  const images = extractImages(root);
  const links = extractLinks(root, baseUrl, pageOrigin);
  const schema = extractSchemaJsonLd(root);
  const lang = extractLang(root);
  const viewport = extractViewport(root);
  const bodyText = extractVisibleBodyText(root);
  const wordCount = countWords(bodyText);
  const textSample = bodyText.slice(0, TEXT_SAMPLE_LIMIT);

  return {
    title,
    metaDescription,
    h1,
    h2,
    canonical,
    robotsMeta,
    openGraph,
    twitterCard,
    images,
    links,
    schema,
    lang,
    viewport,
    wordCount,
    textSample,
  };
}

function extractTitle(root: CheerioAPI): OnPageSeoData["title"] {
  const text = root("head title").first().text();
  return toTextFieldStat(text);
}

function extractMetaDescription(root: CheerioAPI): OnPageSeoData["metaDescription"] {
  const content = root('meta[name="description"]').first().attr("content");
  return toTextFieldStat(content);
}

function extractHeadings(
  root: CheerioAPI,
  tag: "h1" | "h2"
): OnPageSeoData["h1"] {
  const texts: string[] = [];
  root(tag).each((_, element) => {
    if (texts.length >= MAX_HEADING_SAMPLES) {
      return false;
    }
    const text = normalizeWhitespace(root(element).text());
    if (text) {
      texts.push(text);
    }
  });

  return {
    count: root(tag).length,
    texts,
  };
}

function extractCanonical(
  root: CheerioAPI,
  baseUrl: string
): OnPageSeoData["canonical"] {
  const hrefRaw = root('link[rel="canonical"]').first().attr("href")?.trim();
  if (!hrefRaw) {
    return { href: null, exists: false, isAbsolute: false };
  }

  const resolved = resolveDocumentUrl(hrefRaw, baseUrl) ?? hrefRaw;
  const isAbsolute = /^https?:\/\//i.test(hrefRaw);

  return {
    href: resolved,
    exists: true,
    isAbsolute,
  };
}

function extractRobotsMeta(root: CheerioAPI): OnPageSeoData["robotsMeta"] {
  const content = root('meta[name="robots"]').first().attr("content")?.trim() ?? null;
  const normalized = content?.toLowerCase() ?? "";

  return {
    content,
    noindex: normalized.includes("noindex"),
    nofollow: normalized.includes("nofollow"),
  };
}

function extractOpenGraph(root: CheerioAPI): OnPageSeoData["openGraph"] {
  const title = metaContent(root, "og:title");
  const description = metaContent(root, "og:description");
  const image = metaContent(root, "og:image");
  const url = metaContent(root, "og:url");
  const type = metaContent(root, "og:type");
  const exists = Boolean(title || description || image || url || type);

  return { title, description, image, url, type, exists };
}

function extractTwitterCard(root: CheerioAPI): OnPageSeoData["twitterCard"] {
  const card = metaContent(root, "twitter:card");
  const title = metaContent(root, "twitter:title");
  const description = metaContent(root, "twitter:description");
  const image = metaContent(root, "twitter:image");
  const exists = Boolean(card || title || description || image);

  return { card, title, description, image, exists };
}

function metaContent(root: CheerioAPI, key: string): string | null {
  const value =
    root(`meta[property="${key}"]`).first().attr("content") ??
    root(`meta[name="${key}"]`).first().attr("content");

  if (!value) {
    return null;
  }

  const normalized = normalizeWhitespace(value);
  return normalized || null;
}

function extractImages(root: CheerioAPI): OnPageSeoData["images"] {
  let missingAlt = 0;
  let emptyAlt = 0;
  let withAlt = 0;

  root("img").each((_, element) => {
    const alt = root(element).attr("alt");
    if (alt === undefined) {
      missingAlt += 1;
      return;
    }
    if (!normalizeWhitespace(alt)) {
      emptyAlt += 1;
      return;
    }
    withAlt += 1;
  });

  return {
    total: root("img").length,
    missingAlt,
    emptyAlt,
    withAlt,
  };
}

function extractLinks(
  root: CheerioAPI,
  baseUrl: string,
  pageOrigin: string
): OnPageSeoData["links"] {
  let internal = 0;
  let external = 0;
  let nofollow = 0;
  let brokenFormat = 0;

  root("a[href]").each((_, element) => {
    const href = root(element).attr("href") ?? "";
    const trimmed = href.trim();

    if (!trimmed || trimmed === "#") {
      return;
    }

    if (isBrokenLinkHref(trimmed)) {
      brokenFormat += 1;
      return;
    }

    const rel = (root(element).attr("rel") ?? "").toLowerCase();
    if (rel.includes("nofollow")) {
      nofollow += 1;
    }

    const resolved = resolveDocumentUrl(trimmed, baseUrl);
    if (!resolved) {
      brokenFormat += 1;
      return;
    }

    if (isInternalUrl(resolved, pageOrigin)) {
      internal += 1;
    } else {
      external += 1;
    }
  });

  return {
    total: root("a[href]").length,
    internal,
    external,
    nofollow,
    brokenFormat,
  };
}

function extractSchemaJsonLd(root: CheerioAPI): SchemaStat {
  const types = new Set<string>();
  let jsonLdCount = 0;
  let hasOrganization = false;
  let hasLocalBusiness = false;
  let hasFAQ = false;
  let hasBreadcrumb = false;

  root('script[type="application/ld+json"]').each((_, element) => {
    const raw = root(element).html()?.trim();
    if (!raw) {
      return;
    }

    jsonLdCount += 1;

    try {
      const parsed: unknown = JSON.parse(raw);
      collectSchemaTypes(parsed, types, {
        markOrganization: () => {
          hasOrganization = true;
        },
        markLocalBusiness: () => {
          hasLocalBusiness = true;
        },
        markFAQ: () => {
          hasFAQ = true;
        },
        markBreadcrumb: () => {
          hasBreadcrumb = true;
        },
      });
    } catch {
      // Ignore invalid JSON-LD blocks
    }
  });

  return {
    jsonLdCount,
    types: [...types].sort(),
    hasOrganization,
    hasLocalBusiness,
    hasFAQ,
    hasBreadcrumb,
  };
}

type SchemaMarkers = {
  markOrganization: () => void;
  markLocalBusiness: () => void;
  markFAQ: () => void;
  markBreadcrumb: () => void;
};

function collectSchemaTypes(
  node: unknown,
  types: Set<string>,
  markers: SchemaMarkers
): void {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectSchemaTypes(item, types, markers);
    }
    return;
  }

  const record = node as Record<string, unknown>;

  if ("@graph" in record) {
    collectSchemaTypes(record["@graph"], types, markers);
  }

  const typeValue = record["@type"];
  const typeNames = normalizeSchemaTypes(typeValue);
  for (const typeName of typeNames) {
    types.add(typeName);
    applySchemaMarkers(typeName, markers);
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      collectSchemaTypes(value, types, markers);
    }
  }
}

function normalizeSchemaTypes(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function applySchemaMarkers(typeName: string, markers: SchemaMarkers): void {
  if (ORGANIZATION_TYPES.has(typeName)) {
    markers.markOrganization();
  }
  if (LOCAL_BUSINESS_TYPES.has(typeName)) {
    markers.markLocalBusiness();
    markers.markOrganization();
  }
  if (typeName === "FAQPage" || typeName === "Question") {
    markers.markFAQ();
  }
  if (typeName === "BreadcrumbList") {
    markers.markBreadcrumb();
  }
}

function extractLang(root: CheerioAPI): OnPageSeoData["lang"] {
  const htmlLang = root("html").attr("lang")?.trim() ?? null;
  const normalized = htmlLang ? normalizeWhitespace(htmlLang) : null;

  return {
    htmlLang: normalized,
    exists: Boolean(normalized),
  };
}

function extractViewport(root: CheerioAPI): OnPageSeoData["viewport"] {
  const content =
    root('meta[name="viewport"]').first().attr("content")?.trim() ?? null;

  return {
    content,
    exists: Boolean(content),
  };
}

function extractVisibleBodyText(root: CheerioAPI): string {
  const clone = root("body").clone();
  clone.find("script, style, noscript").remove();
  return normalizeWhitespace(clone.text());
}

function countWords(text: string): number {
  if (!text) {
    return 0;
  }
  return text.split(/\s+/).filter(Boolean).length;
}
