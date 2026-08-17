import { createHmac } from "node:crypto";

import { safeCompare } from "@/lib/security";

const MAX_CLOCK_SKEW_SECONDS = 300;

export function signWordPressPing(body: string, secret: string, timestamp: string): string {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

export function verifyWordPressPingSignature(input: {
  body: string;
  secret: string;
  timestamp: string | null;
  signature: string | null;
  nowMs?: number;
}): boolean {
  if (!input.timestamp || !input.signature || !/^\d{10}$/.test(input.timestamp)) {
    return false;
  }
  const timestampSeconds = Number(input.timestamp);
  const nowSeconds = Math.floor((input.nowMs ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > MAX_CLOCK_SKEW_SECONDS) {
    return false;
  }
  return safeCompare(
    signWordPressPing(input.body, input.secret, input.timestamp),
    input.signature
  );
}
