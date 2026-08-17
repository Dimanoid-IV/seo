import { createHash } from "node:crypto";

import { load } from "cheerio";

export type ExtractedCrawlDocument = {
  title: string | null;
  metaDescription: string | null;
  headings: Array<{ level: number; text: string }>;
  bodyText: string;
  internalLinks: string[];
  internalLinkDetails: Array<{ url: string; anchor: string }>;
  externalLinks: string[];
  canonicalUrl: string | null;
  robotsDirective: string | null;
  indexable: boolean;
  schema: unknown[];
  hreflang: Array<{ locale: string; url: string }>;
  images: Array<{ src: string; alt: string | null }>;
  locale: string | null;
  wordCount: number;
  contentHash: string;
};

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "msclkid",
  "ref",
  "source",
]);

export function normalizeCrawlUrl(value: string, baseUrl?: string): string | null {
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) {
      url.port = "";
    }
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

function text(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function resolveHttpUrl(value: string | undefined, baseUrl: string): string | null {
  if (!value) return null;
  return normalizeCrawlUrl(value, baseUrl);
}

export function inferPageType(urlValue: string):
  | "HOME" | "ABOUT" | "PRODUCT" | "SERVICE" | "CATEGORY" | "BLOG" | "CONTACT" | "LEGAL" | "OTHER" {
  const path = new URL(urlValue).pathname.toLowerCase();
  if (path === "/") return "HOME";
  if (/\/(about|meist|o-nas)(\/|$)/.test(path)) return "ABOUT";
  if (/\/(contact|kontakt|kontakty)(\/|$)/.test(path)) return "CONTACT";
  if (/\/(privacy|terms|legal|policy|privaatsus)(\/|$)/.test(path)) return "LEGAL";
  if (/\/(blog|article|news)(\/|$)/.test(path)) return "BLOG";
  if (/\/(product|products|toode|shop)(\/|$)/.test(path)) return "PRODUCT";
  if (/\/(service|services|teenus|uslugi)(\/|$)/.test(path)) return "SERVICE";
  if (/\/(category|collection|kategooria)(\/|$)/.test(path)) return "CATEGORY";
  return "OTHER";
}

export function extractCrawlDocument(html: string, finalUrl: string): ExtractedCrawlDocument {
  const $ = load(html);
  const origin = new URL(finalUrl).origin;
  const baseUrl = resolveHttpUrl($("base[href]").first().attr("href"), finalUrl) ?? finalUrl;
  const internal = new Set<string>();
  const internalLinkDetails: Array<{ url: string; anchor: string }> = [];
  const external = new Set<string>();
  $("a[href]").each((_, element) => {
    const resolved = resolveHttpUrl($(element).attr("href"), baseUrl);
    if (!resolved) return;
    if (new URL(resolved).origin === origin) {
      internal.add(resolved);
      internalLinkDetails.push({ url: resolved, anchor: text($(element).text()) });
    }
    else external.add(resolved);
  });

  const headings: ExtractedCrawlDocument["headings"] = [];
  $("h1,h2,h3,h4,h5,h6").each((_, element) => {
    const headingText = text($(element).text());
    if (headingText) headings.push({ level: Number(element.tagName.slice(1)), text: headingText });
  });
  const schema: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      schema.push(JSON.parse($(element).html() ?? ""));
    } catch {
      // Malformed JSON-LD is retained as an audit issue by omission from parsed schema.
    }
  });
  const images: ExtractedCrawlDocument["images"] = [];
  $("img[src]").each((_, element) => {
    const src = resolveHttpUrl($(element).attr("src"), baseUrl);
    if (src) images.push({ src, alt: $(element).attr("alt") ?? null });
  });
  const hreflang: ExtractedCrawlDocument["hreflang"] = [];
  $('link[rel="alternate"][hreflang][href]').each((_, element) => {
    const locale = text($(element).attr("hreflang") ?? "").toLowerCase();
    const url = resolveHttpUrl($(element).attr("href"), baseUrl);
    if (locale && url) hreflang.push({ locale, url });
  });

  $("script,style,noscript,template,svg").remove();
  const bodyText = text($("body").text());
  const robotsDirective = $("meta[name=robots],meta[name=googlebot]")
    .map((_, element) => $(element).attr("content") ?? "")
    .get()
    .join(",")
    .toLowerCase() || null;
  const canonicalUrl = resolveHttpUrl($('link[rel="canonical"]').first().attr("href"), baseUrl);
  const title = text($("title").first().text()) || null;
  const metaDescription = text($("meta[name=description]").first().attr("content") ?? "") || null;
  const locale = text($("html").attr("lang") ?? "").toLowerCase() || null;
  const contentHash = createHash("sha256")
    .update(JSON.stringify({ title, metaDescription, headings, bodyText, canonicalUrl, robotsDirective }))
    .digest("hex");

  return {
    title,
    metaDescription,
    headings,
    bodyText,
    internalLinks: [...internal],
    internalLinkDetails,
    externalLinks: [...external],
    canonicalUrl,
    robotsDirective,
    indexable: !robotsDirective?.includes("noindex"),
    schema,
    hreflang,
    images,
    locale,
    wordCount: bodyText ? bodyText.split(/\s+/).length : 0,
    contentHash,
  };
}

export function crawlUrlHash(normalizedUrl: string): string {
  return createHash("sha256").update(normalizedUrl).digest("hex");
}
