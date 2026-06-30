import { AppError } from "@/lib/errors";

import { createScannerError } from "./errors";
import { AuditScannerErrorCode } from "./types";

const BLOCKED_SCHEMES = new Set([
  "file:",
  "ftp:",
  "ftps:",
  "gopher:",
  "javascript:",
  "data:",
  "blob:",
  "mailto:",
  "tel:",
  "ws:",
  "wss:",
  "dict:",
  "ldap:",
  "ldaps:",
]);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
  "[::1]",
]);

const LOCAL_DNS_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".home.arpa",
  ".lan",
  ".corp",
  ".localdomain",
];

/**
 * Returns true when the hostname matches a blocked local/special DNS pattern.
 */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");

  if (!host) {
    return true;
  }

  if (BLOCKED_HOSTNAMES.has(host)) {
    return true;
  }

  if (host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }

  for (const suffix of LOCAL_DNS_SUFFIXES) {
    if (host.endsWith(suffix)) {
      return true;
    }
  }

  // IPv6 literal in URL hostname (with or without brackets)
  if (host.startsWith("[") || host.includes(":")) {
    return isPrivateIp(normalizeIpAddress(host));
  }

  return isPrivateIp(host);
}

/**
 * Returns true when an IP address belongs to a private, loopback, or link-local range.
 */
export function isPrivateIp(ip: string): boolean {
  const normalized = normalizeIpAddress(ip);

  if (!normalized) {
    return false;
  }

  if (normalized.includes(":")) {
    return isPrivateIpv6(normalized);
  }

  return isPrivateIpv4(normalized);
}

function normalizeIpAddress(value: string): string {
  return value.trim().toLowerCase().replace(/^\[|\]$/g, "");
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
    return true;
  }

  // Unique local (fc00::/7) and link-local (fe80::/10)
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }

  // IPv4-mapped IPv6
  if (ip.startsWith("::ffff:")) {
    const mapped = ip.slice("::ffff:".length);
    return isPrivateIpv4(mapped);
  }

  return false;
}

/**
 * Validates that a URL uses an allowed scheme and hostname before network access.
 */
export function assertAllowedScheme(url: URL): void {
  if (!url.protocol || BLOCKED_SCHEMES.has(url.protocol)) {
    throw createScannerError(AuditScannerErrorCode.SSRF_BLOCKED, undefined, {
      scheme: url.protocol,
    });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw createScannerError(AuditScannerErrorCode.SSRF_BLOCKED, undefined, {
      scheme: url.protocol,
    });
  }

  if (url.username || url.password) {
    throw createScannerError(AuditScannerErrorCode.SSRF_BLOCKED, undefined, {
      reason: "credentials_in_url",
    });
  }
}

/**
 * Resolves the hostname and rejects private/blocked addresses (DNS rebinding protection).
 */
export async function assertSafeHostname(hostname: string): Promise<void> {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");

  if (!host) {
    throw createScannerError(AuditScannerErrorCode.INVALID_URL, undefined, {
      reason: "empty_hostname",
    });
  }

  if (isBlockedHostname(host)) {
    throw createScannerError(AuditScannerErrorCode.BLOCKED_HOST, undefined, {
      hostname: host,
    });
  }

  // Literal IP — no DNS lookup required
  if (isIpLiteral(host)) {
    if (isPrivateIp(host)) {
      throw createScannerError(AuditScannerErrorCode.SSRF_BLOCKED, undefined, {
        ip: host,
      });
    }
    return;
  }

  try {
    const dns = await import("node:dns/promises");
    const results = await dns.lookup(host, { all: true, verbatim: true });

    if (results.length === 0) {
      throw createScannerError(AuditScannerErrorCode.DNS_FAILURE, undefined, {
        hostname: host,
      });
    }

    for (const result of results) {
      if (isPrivateIp(result.address)) {
        throw createScannerError(AuditScannerErrorCode.SSRF_BLOCKED, undefined, {
          hostname: host,
          resolvedIp: result.address,
        });
      }
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error && "code" in error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
        throw createScannerError(AuditScannerErrorCode.DNS_FAILURE, undefined, {
          hostname: host,
          cause: code,
        });
      }
    }

    throw createScannerError(AuditScannerErrorCode.DNS_FAILURE, undefined, {
      hostname: host,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Full SSRF check: allowed scheme + safe hostname resolution.
 */
export async function assertSafeUrl(url: URL): Promise<void> {
  assertAllowedScheme(url);
  await assertSafeHostname(url.hostname);
}

function isIpLiteral(host: string): boolean {
  const normalized = normalizeIpAddress(host);
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    return true;
  }
  return normalized.includes(":");
}
