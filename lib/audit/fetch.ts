import { createScannerError, classifyNetworkError } from "./errors";
import { assertSafeUrl } from "./ssrf";
import {
  AuditScannerErrorCode,
  SCANNER_MAX_HTML_BYTES,
  SCANNER_MAX_REDIRECTS,
  SCANNER_MAX_RESPONSE_TIME_MS,
  SCANNER_USER_AGENT,
  type FetchHtmlResult,
} from "./types";

const HTML_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];

/**
 * Fetches a single HTML page, following redirects manually with SSRF checks.
 */
export async function fetchHtmlPage(
  startUrl: string,
  deadlineMs: number = SCANNER_MAX_RESPONSE_TIME_MS
): Promise<FetchHtmlResult> {
  const startedAt = Date.now();
  let currentUrl = startUrl;
  let redirectCount = 0;
  let lastStatusCode = 0;
  let lastHeaders = new Headers();
  let lastContentType: string | null = null;
  let lastCharset: string | null = null;

  while (redirectCount <= SCANNER_MAX_REDIRECTS) {
    const elapsed = Date.now() - startedAt;
    const remainingMs = deadlineMs - elapsed;

    if (remainingMs <= 0) {
      throw createScannerError(AuditScannerErrorCode.TIMEOUT, undefined, {
        url: currentUrl,
        redirectCount,
      });
    }

    const parsed = new URL(currentUrl);
    await assertSafeUrl(parsed);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(remainingMs),
        headers: {
          "User-Agent": SCANNER_USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
          "Accept-Language": "en,ru,et;q=0.8",
        },
      });
    } catch (error) {
      throw classifyNetworkError(error);
    }

    lastStatusCode = response.status;
    lastHeaders = response.headers;
    lastContentType = response.headers.get("content-type");
    lastCharset = parseCharset(lastContentType);

    if (isRedirectStatus(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw createScannerError(
          AuditScannerErrorCode.WEBSITE_UNREACHABLE,
          "Редирект без заголовка Location",
          { url: currentUrl, statusCode: response.status }
        );
      }

      currentUrl = new URL(location, currentUrl).toString();
      redirectCount += 1;
      continue;
    }

    if (response.status >= 400) {
      throw createScannerError(AuditScannerErrorCode.WEBSITE_UNREACHABLE, undefined, {
        url: currentUrl,
        statusCode: response.status,
      });
    }

    assertHtmlContentType(lastContentType, currentUrl);

    const { html, htmlSize } = await readHtmlBody(response, lastCharset);

    return {
      finalUrl: currentUrl,
      statusCode: lastStatusCode,
      headers: headersToRecord(lastHeaders),
      contentType: lastContentType,
      charset: lastCharset,
      responseTimeMs: Date.now() - startedAt,
      redirectCount,
      html,
      htmlSize,
    };
  }

  throw createScannerError(AuditScannerErrorCode.WEBSITE_UNREACHABLE, "Слишком много редиректов", {
    url: currentUrl,
    redirectCount,
    maxRedirects: SCANNER_MAX_REDIRECTS,
  });
}

function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

/**
 * Parses charset from a Content-Type header value.
 */
export function parseCharset(contentType: string | null): string | null {
  if (!contentType) {
    return null;
  }

  const match = contentType.match(/charset=([^;\s]+)/i);
  if (!match?.[1]) {
    return null;
  }

  return match[1].replace(/"/g, "").trim().toLowerCase() || null;
}

function assertHtmlContentType(contentType: string | null, url: string): void {
  if (!contentType) {
    throw createScannerError(
      AuditScannerErrorCode.UNSUPPORTED_CONTENT_TYPE,
      undefined,
      { url, contentType: null }
    );
  }

  const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!HTML_CONTENT_TYPES.includes(mime)) {
    throw createScannerError(
      AuditScannerErrorCode.UNSUPPORTED_CONTENT_TYPE,
      undefined,
      { url, contentType: mime }
    );
  }
}

async function readHtmlBody(
  response: Response,
  charset: string | null
): Promise<{ html: string; htmlSize: number }> {
  const reader = response.body?.getReader();

  if (!reader) {
    return { html: "", htmlSize: 0 };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalBytes += value.byteLength;
      if (totalBytes > SCANNER_MAX_HTML_BYTES) {
        throw createScannerError(AuditScannerErrorCode.TOO_LARGE, undefined, {
          htmlSize: totalBytes,
          maxBytes: SCANNER_MAX_HTML_BYTES,
        });
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const buffer = Buffer.concat(chunks);
  const encoding = normalizeEncoding(charset);
  const html = new TextDecoder(encoding, { fatal: false }).decode(buffer);

  return { html, htmlSize: buffer.byteLength };
}

function normalizeEncoding(charset: string | null): string {
  if (!charset) {
    return "utf-8";
  }

  const normalized = charset.toLowerCase();
  if (normalized === "utf8") {
    return "utf-8";
  }

  return normalized;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
}
