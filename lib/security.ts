import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { nanoid } from "nanoid";

/**
 * Timing-safe string comparison. Returns false if lengths differ.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

/**
 * SHA-256 hex digest for API key verification hashes (not for password storage).
 */
export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Generates a URL-safe random token, optionally with a prefix (e.g. "rb_preview").
 */
export function generateToken(prefix?: string): string {
  const token = nanoid(21);
  return prefix ? `${prefix}_${token}` : token;
}

/**
 * Generates cryptographically secure random bytes as a hex string.
 */
export function generateSecretHex(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex");
}

/**
 * Ensures the module runs only on the server (throws in browser contexts).
 */
export function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error("This operation can only run on the server");
  }
}
