/**
 * Privacy-safe property sanitization for product analytics.
 */

const FORBIDDEN_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /refresh/i,
  /webhook/i,
  /contenthtml/i,
  /content_html/i,
  /body/i,
  /html/i,
  /email/i,
  /access[_-]?token/i,
];

const FORBIDDEN_VALUE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i,
  /sk_(live|test)_[A-Za-z0-9]+/i,
  /whsec_[A-Za-z0-9]+/i,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/i, // JWT-ish
];

const ALLOWED_KEYS = new Set([
  "plan",
  "planName",
  "locale",
  "route",
  "feature",
  "status",
  "step",
  "stepName",
  "integration",
  "integrationType",
  "platform",
  "confidence",
  "count",
  "counts",
  "source",
  "action",
  "method",
  "format",
  "qualityPassed",
  "qualityScore",
  "articleId",
  "planId",
  "topicId",
  "auditId",
  "tone",
  "reason",
  "cta",
  "page",
  "days",
]);

function isForbiddenKey(key: string): boolean {
  return FORBIDDEN_KEY_PATTERNS.some((p) => p.test(key));
}

function sanitizeString(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (FORBIDDEN_VALUE_PATTERNS.some((p) => p.test(trimmed))) return null;
  // Strip query strings from URLs (may contain tokens)
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return `${url.origin}${url.pathname}`.slice(0, 200);
    } catch {
      return null;
    }
  }
  // Avoid logging emails
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed.slice(0, 200);
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return undefined;
  if (value == null) return null;
  if (typeof value === "boolean" || typeof value === "number") {
    if (typeof value === "number" && !Number.isFinite(value)) return null;
    return value;
  }
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((v) => sanitizeValue(v, depth + 1))
      .filter((v) => v !== undefined);
  }
  if (typeof value === "object") {
    return sanitizeProperties(value as Record<string, unknown>, depth + 1);
  }
  return undefined;
}

/**
 * Removes forbidden keys/values. Only allowlisted keys (+ short safe scalars) remain.
 */
export function sanitizeProperties(
  properties: Record<string, unknown> | null | undefined,
  depth = 0
): Record<string, unknown> {
  if (!properties || typeof properties !== "object") return {};

  const out: Record<string, unknown> = {};
  for (const [rawKey, rawValue] of Object.entries(properties)) {
    const key = rawKey.trim();
    if (!key || isForbiddenKey(key)) continue;
    // Prefer allowlist; also allow short camelCase feature flags like "exportFormat"
    const allowed =
      ALLOWED_KEYS.has(key) ||
      (/^[a-z][A-Za-z0-9]{0,40}$/.test(key) && key.length <= 40);
    if (!allowed) continue;

    const cleaned = sanitizeValue(rawValue, depth);
    if (cleaned === undefined || cleaned === null) continue;
    if (typeof cleaned === "object" && !Array.isArray(cleaned)) {
      if (Object.keys(cleaned as object).length === 0) continue;
    }
    out[key] = cleaned;
  }
  return out;
}

export function assertNoSensitiveLeak(
  properties: Record<string, unknown>
): boolean {
  const json = JSON.stringify(properties);
  if (/Bearer\s+/i.test(json)) return false;
  if (/sk_(live|test)_/i.test(json)) return false;
  if (/whsec_/i.test(json)) return false;
  if (/"email"\s*:/i.test(json)) return false;
  if (/"password"\s*:/i.test(json)) return false;
  if (/contentHtml/i.test(json)) return false;
  return true;
}
