/**
 * HMAC signatures for custom publishing webhooks.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sign a raw body with HMAC-SHA256. Header value format: sha256=<hex>.
 */
export function signWebhookPayload(
  body: string,
  secret: string
): string {
  const digest = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  return `sha256=${digest}`;
}

export function verifyWebhookSignature(
  body: string,
  secret: string,
  headerValue: string | null | undefined
): boolean {
  if (!headerValue || !secret) return false;
  const expected = signWebhookPayload(body, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(headerValue.trim());
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
