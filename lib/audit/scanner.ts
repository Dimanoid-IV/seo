import { assertServerOnly } from "@/lib/security";

import {
  classifyNetworkError,
  createScannerError,
  isNonRetryableScannerError,
} from "./errors";
import { fetchHtmlPage } from "./fetch";
import { getFetchSchemes, normalizeUrl, withScheme } from "./normalize";
import { AuditScannerErrorCode, type WebsiteScanResult } from "./types";

/**
 * Scans a website URL: normalizes input, applies SSRF checks, fetches HTML.
 * Tries `https` first (unless the input explicitly uses `http`), then falls back to `http`.
 *
 * @param rawUrl - User-provided URL (e.g. `example.com` or `https://example.com`)
 * @returns Structured scan result including HTML and response metadata
 * @throws AppError with `details.scannerError` on failure
 */
export async function scanWebsite(rawUrl: string): Promise<WebsiteScanResult> {
  assertServerOnly();

  const normalizedUrl = normalizeUrl(rawUrl);
  const schemes = getFetchSchemes(normalizedUrl);
  let lastError: unknown;

  for (const scheme of schemes) {
    const fetchUrl = withScheme(normalizedUrl, scheme);

    try {
      const result = await fetchHtmlPage(fetchUrl);

      return {
        normalizedUrl,
        finalUrl: result.finalUrl,
        statusCode: result.statusCode,
        headers: result.headers,
        contentType: result.contentType,
        charset: result.charset,
        responseTimeMs: result.responseTimeMs,
        redirectCount: result.redirectCount,
        html: result.html,
        htmlSize: result.htmlSize,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      lastError = error;

      if (isNonRetryableScannerError(error)) {
        throw error;
      }

      // Only attempt http fallback after https-specific failures
      if (scheme === "https" && schemes.includes("http")) {
        continue;
      }

      throw classifyNetworkError(error);
    }
  }

  if (lastError instanceof Error) {
    throw classifyNetworkError(lastError);
  }

  throw createScannerError(AuditScannerErrorCode.WEBSITE_UNREACHABLE, undefined, {
    normalizedUrl,
  });
}
