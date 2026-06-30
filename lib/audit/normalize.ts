import { createScannerError } from "./errors";
import { AuditScannerErrorCode } from "./types";

const BLOCKED_SCHEMES_PATTERN =
  /^(file|ftp|ftps|gopher|javascript|data|blob|mailto|tel|ws|wss|dict|ldap|ldaps):/i;

/**
 * Normalizes a user-provided website URL for scanning.
 * Adds `https://` when no scheme is present and strips fragments.
 *
 * @throws AppError with {@link AuditScannerErrorCode.INVALID_URL} when input is invalid.
 */
export function normalizeUrl(rawInput: string): string {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    throw createScannerError(AuditScannerErrorCode.INVALID_URL, undefined, {
      reason: "empty_input",
    });
  }

  if (BLOCKED_SCHEMES_PATTERN.test(trimmed)) {
    throw createScannerError(AuditScannerErrorCode.SSRF_BLOCKED, undefined, {
      input: trimmed,
    });
  }

  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw createScannerError(AuditScannerErrorCode.INVALID_URL, undefined, {
      input: trimmed,
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw createScannerError(AuditScannerErrorCode.SSRF_BLOCKED, undefined, {
      scheme: parsed.protocol,
    });
  }

  if (!parsed.hostname.trim()) {
    throw createScannerError(AuditScannerErrorCode.INVALID_URL, undefined, {
      reason: "missing_hostname",
    });
  }

  parsed.hash = "";

  // Remove default ports for consistency
  if (
    (parsed.protocol === "https:" && parsed.port === "443") ||
    (parsed.protocol === "http:" && parsed.port === "80")
  ) {
    parsed.port = "";
  }

  parsed.hostname = parsed.hostname.toLowerCase();

  return parsed.toString().replace(/\/$/, "") || parsed.origin;
}

/**
 * Returns the schemes to attempt for fetching, preserving an explicit http:// input.
 */
export function getFetchSchemes(normalizedUrl: string): Array<"https" | "http"> {
  const protocol = new URL(normalizedUrl).protocol;
  if (protocol === "http:") {
    return ["http"];
  }
  return ["https", "http"];
}

/**
 * Builds a URL string with a specific scheme while preserving host/path/query.
 */
export function withScheme(normalizedUrl: string, scheme: "https" | "http"): string {
  const url = new URL(normalizedUrl);
  url.protocol = `${scheme}:`;
  return url.toString().replace(/\/$/, "") || url.origin;
}
