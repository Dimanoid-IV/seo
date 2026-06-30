import type { ErrorDetails } from "@/lib/errors";

/** Scanner-specific error identifiers (mapped to AppError). */
export const AuditScannerErrorCode = {
  WEBSITE_UNREACHABLE: "WEBSITE_UNREACHABLE",
  TIMEOUT: "TIMEOUT",
  INVALID_URL: "INVALID_URL",
  BLOCKED_HOST: "BLOCKED_HOST",
  UNSUPPORTED_CONTENT_TYPE: "UNSUPPORTED_CONTENT_TYPE",
  TOO_LARGE: "TOO_LARGE",
  SSRF_BLOCKED: "SSRF_BLOCKED",
  DNS_FAILURE: "DNS_FAILURE",
  SSL_FAILURE: "SSL_FAILURE",
} as const;

export type AuditScannerErrorCode =
  (typeof AuditScannerErrorCode)[keyof typeof AuditScannerErrorCode];

/** Maximum time for a full scan (fetch + redirects), in milliseconds. */
export const SCANNER_MAX_RESPONSE_TIME_MS = 15_000;

/** Maximum HTML body size in bytes (5 MB). */
export const SCANNER_MAX_HTML_BYTES = 5 * 1024 * 1024;

/** Maximum redirects to follow per scan. */
export const SCANNER_MAX_REDIRECTS = 10;

/** Default User-Agent sent with scanner requests. */
export const SCANNER_USER_AGENT =
  "RankBoostScanner/1.0 (+https://rankboost.eu/bot)";

export type WebsiteScanResult = {
  normalizedUrl: string;
  finalUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  contentType: string | null;
  charset: string | null;
  responseTimeMs: number;
  redirectCount: number;
  html: string;
  htmlSize: number;
  fetchedAt: string;
};

export type FetchHtmlResult = Omit<
  WebsiteScanResult,
  "normalizedUrl" | "fetchedAt"
> & {
  fetchedAt?: string;
};

export type NormalizeUrlOptions = {
  /** Prefer https when the input has no explicit scheme. Default: true. */
  preferHttps?: boolean;
};

export type ScannerErrorDetails = ErrorDetails & {
  scannerError: AuditScannerErrorCode;
};
