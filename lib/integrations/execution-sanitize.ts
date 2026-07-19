/**
 * Sanitized preview/result helpers for integration execution jobs.
 * Never persist secrets, tokens, passwords, or full HTML bodies.
 */

const FORBIDDEN_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /refresh/i,
  /sharedsecret/i,
  /applicationpassword/i,
  /access[_-]?token/i,
  /contenthtml/i,
  /content_html/i,
  /contentmarkdown/i,
  /html$/i,
  /markdown$/i,
  /body$/i,
];

const FORBIDDEN_VALUE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i,
  /sk_(live|test)_[A-Za-z0-9]+/i,
  /whsec_[A-Za-z0-9]+/i,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/i,
];

const ALLOWED_KEYS = new Set([
  "action",
  "provider",
  "mode",
  "capability",
  "sourceType",
  "sourceId",
  "title",
  "slug",
  "metaTitle",
  "metaDescription",
  "language",
  "contentHtmlLength",
  "summary",
  "status",
  "externalId",
  "externalUrl",
  "errorCode",
  "dryRun",
  "event",
  "host",
  "endpointHost",
  "wordpressPostId",
  "qualityPassed",
  "qualityScore",
  "articleId",
  "taskId",
  "planItemId",
  "target",
  "retryCount",
  "reason",
  "message",
]);

function isForbiddenKey(key: string): boolean {
  return FORBIDDEN_KEY_PATTERNS.some((p) => p.test(key));
}

function sanitizeString(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (FORBIDDEN_VALUE_PATTERNS.some((p) => p.test(trimmed))) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return `${url.origin}${url.pathname}`.slice(0, 300);
    } catch {
      return null;
    }
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed.slice(0, 500);
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 4) return null;
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean" || typeof value === "number") {
    if (typeof value === "number" && !Number.isFinite(value)) return null;
    return value;
  }
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => sanitizeValue(item, depth + 1))
      .filter((item) => item !== null);
  }
  if (typeof value === "object") {
    return sanitizeExecutionPayload(value as Record<string, unknown>, depth + 1);
  }
  return null;
}

/**
 * Returns a JSON-safe object with secrets/HTML stripped.
 */
export function sanitizeExecutionPayload(
  input: unknown,
  depth = 0
): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }
  const out: Record<string, unknown> = {};
  for (const [rawKey, rawValue] of Object.entries(
    input as Record<string, unknown>
  )) {
    const key = rawKey.slice(0, 80);
    if (isForbiddenKey(key)) continue;
    if (!ALLOWED_KEYS.has(key) && depth === 0) {
      // At top level only allow known keys; nested objects already filtered by parent.
      continue;
    }
    if (depth > 0 && isForbiddenKey(key)) continue;
    if (depth > 0 && !ALLOWED_KEYS.has(key) && typeof rawValue === "object") {
      continue;
    }
    if (depth > 0 && !ALLOWED_KEYS.has(key) && typeof rawValue !== "object") {
      // Nested primitives only if key is allowed
      if (!ALLOWED_KEYS.has(key)) continue;
    }
    const sanitized = sanitizeValue(rawValue, depth + 1);
    if (sanitized === null || sanitized === undefined) continue;
    if (Array.isArray(sanitized) && sanitized.length === 0) continue;
    if (
      typeof sanitized === "object" &&
      !Array.isArray(sanitized) &&
      Object.keys(sanitized as object).length === 0
    ) {
      continue;
    }
    out[key] = sanitized;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function sanitizeExecutionErrorMessage(
  message: string | null | undefined
): string | null {
  if (!message) return null;
  const cleaned = sanitizeString(message);
  if (!cleaned) return "Ошибка выполнения интеграции";
  // Redact obvious secret-looking substrings
  return cleaned
    .replace(/Bearer\s+\S+/gi, "[redacted]")
    .replace(/sk_(live|test)_\S+/gi, "[redacted]")
    .replace(/whsec_\S+/gi, "[redacted]")
    .slice(0, 400);
}

export function assertPayloadHasNoSecrets(payload: unknown): boolean {
  const text = JSON.stringify(payload ?? {});
  if (!text) return true;
  if (/password|secret|token|apikey|authorization/i.test(text)) {
    // Keys may appear in allowlist names like "hasSharedSecret" — check values
    if (
      FORBIDDEN_VALUE_PATTERNS.some((p) => p.test(text)) ||
      /"password"\s*:/i.test(text) ||
      /"secret"\s*:/i.test(text) ||
      /"applicationPassword"\s*:/i.test(text) ||
      /"accessToken"\s*:/i.test(text)
    ) {
      return false;
    }
  }
  if (/contentHtml|contentMarkdown/i.test(text)) return false;
  return true;
}
