/**
 * WordPress site URL normalization + SSRF-safe validation helpers.
 */

import { assertSafeUrl, isBlockedHostname } from "@/lib/audit/ssrf";
import { AppError, ErrorCode } from "@/lib/errors";

export type NormalizeWordPressUrlResult = {
  normalized: string;
  https: boolean;
  httpsWarning: boolean;
};

/**
 * Normalize a WordPress site URL: strip path/query/hash, no trailing slash.
 */
export function normalizeWordPressUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = "";
    parsed.username = "";
    parsed.password = "";
    let normalized = `${parsed.protocol}//${parsed.host}`;
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return trimmed.replace(/\/$/, "");
  }
}

export function parseWordPressUrlOrThrow(raw: string): URL {
  const normalized = normalizeWordPressUrl(raw);
  if (!normalized) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Укажите URL сайта WordPress."
    );
  }
  try {
    return new URL(normalized);
  } catch {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Некорректный URL сайта WordPress."
    );
  }
}

/**
 * SSRF-safe URL check for WordPress targets. Prefers HTTPS; allows HTTP with warning flag.
 */
export async function assertSafeWordPressUrl(
  raw: string
): Promise<NormalizeWordPressUrlResult> {
  const url = parseWordPressUrlOrThrow(raw);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "URL должен использовать http или https."
    );
  }

  if (isBlockedHostname(url.hostname)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Этот адрес недоступен для подключения."
    );
  }

  await assertSafeUrl(url);

  return {
    normalized: normalizeWordPressUrl(url.toString()),
    https: url.protocol === "https:",
    httpsWarning: url.protocol !== "https:",
  };
}

export function buildWpRestBase(siteUrl: string): string {
  return `${normalizeWordPressUrl(siteUrl)}/wp-json/wp/v2`;
}
