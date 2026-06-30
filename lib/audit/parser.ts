import * as cheerio from "cheerio";

import { AppError, ErrorCode } from "@/lib/errors";

import type { ParsedHtmlDocument } from "./onpage-types";

/**
 * Parses HTML into a Cheerio document with a resolved base URL for relative links.
 * Tolerates malformed markup; does not throw on minor HTML issues.
 *
 * @param html - Raw HTML string from the scanner
 * @param finalUrl - Final URL after redirects (used as default base)
 * @returns Cheerio root and effective base URL (respects `<base href>`)
 * @throws AppError only when HTML is empty or finalUrl is invalid
 */
export function parseHtml(html: string, finalUrl: string): ParsedHtmlDocument {
  if (!html.trim()) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "HTML-документ пуст", {
      details: { reason: "empty_html" },
    });
  }

  let pageUrl: URL;
  try {
    pageUrl = new URL(finalUrl);
  } catch {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Некорректный finalUrl для парсера", {
      details: { finalUrl },
    });
  }

  const root = cheerio.load(html);

  const baseHref = root("base[href]").first().attr("href")?.trim();
  const baseUrl = resolveBaseUrl(baseHref, pageUrl);

  return {
    root,
    baseUrl,
    finalUrl: pageUrl.toString(),
  };
}

function resolveBaseUrl(baseHref: string | undefined, pageUrl: URL): string {
  if (!baseHref) {
    return pageUrl.toString();
  }

  try {
    return new URL(baseHref, pageUrl).toString();
  } catch {
    return pageUrl.toString();
  }
}

/**
 * Resolves a possibly relative href against the document base URL.
 */
export function resolveDocumentUrl(href: string, baseUrl: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Collapses whitespace and trims text nodes for consistent SEO field values.
 */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Returns true when href uses an http(s) scheme on the same host as the page.
 */
export function isInternalUrl(resolvedUrl: string, pageOrigin: string): boolean {
  try {
    const parsed = new URL(resolvedUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return parsed.origin === pageOrigin;
  } catch {
    return false;
  }
}

/**
 * Returns true for non-navigational or malformed href values.
 */
export function isBrokenLinkHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed || trimmed === "#") {
    return false;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("data:") ||
    lower.startsWith("blob:")
  ) {
    return false;
  }

  if (trimmed.startsWith("//")) {
    return false;
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return url.protocol !== "http:" && url.protocol !== "https:";
    } catch {
      return true;
    }
  }

  return false;
}

/**
 * Builds a {@link TextFieldStat} from raw extracted text.
 */
export function toTextFieldStat(text: string | null | undefined): {
  text: string | null;
  length: number;
  exists: boolean;
} {
  const normalized = text ? normalizeWhitespace(text) : "";
  if (!normalized) {
    return { text: null, length: 0, exists: false };
  }
  return { text: normalized, length: normalized.length, exists: true };
}
