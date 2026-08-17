import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

type RateLimitInput = {
  request: Request;
  scope: string;
  limit: number;
  windowMs: number;
};

type MemoryBucket = { count: number; expiresAt: number };
const developmentBuckets = new Map<string, MemoryBucket>();

export function getRequestClientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-vercel-forwarded-for")?.trim()
    || request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || forwarded
    || "unknown";
}

function subjectHashForRequest(request: Request): string {
  return createHash("sha256")
    .update(`rankboost-rate-limit:${getRequestClientAddress(request)}`)
    .digest("hex");
}

function rejectRateLimit(retryAfterSeconds: number): never {
  throw new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, "Слишком много запросов. Повторите позже.", {
    details: { retryAfterSeconds },
  });
}

function enforceDevelopmentFallback(input: RateLimitInput, windowStartMs: number): void {
  const key = `${input.scope}:${subjectHashForRequest(input.request)}:${windowStartMs}`;
  const now = Date.now();
  const existing = developmentBuckets.get(key);
  const next = existing && existing.expiresAt > now
    ? { count: existing.count + 1, expiresAt: existing.expiresAt }
    : { count: 1, expiresAt: windowStartMs + input.windowMs };
  developmentBuckets.set(key, next);
  if (next.count > input.limit) {
    rejectRateLimit(Math.max(1, Math.ceil((next.expiresAt - now) / 1000)));
  }
}

/** Durable fixed-window limiter for serverless routes; memory fallback is development-only. */
export async function enforceRateLimit(input: RateLimitInput): Promise<void> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / input.windowMs) * input.windowMs;
  if (!isDatabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Rate limiting storage is unavailable.", {
        statusCode: 503,
      });
    }
    enforceDevelopmentFallback(input, windowStartMs);
    return;
  }

  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + input.windowMs);
  const subjectHash = subjectHashForRequest(input.request);
  const rows = await getPrisma().$queryRaw<Array<{ requestCount: number }>>(Prisma.sql`
    INSERT INTO "api_rate_limit_buckets"
      ("id", "scope", "subjectHash", "windowStart", "requestCount", "expiresAt", "createdAt", "updatedAt")
    VALUES
      (${randomUUID()}::uuid, ${input.scope}, ${subjectHash}, ${windowStart}, 1, ${expiresAt}, NOW(), NOW())
    ON CONFLICT ("scope", "subjectHash", "windowStart")
    DO UPDATE SET "requestCount" = "api_rate_limit_buckets"."requestCount" + 1, "updatedAt" = NOW()
    RETURNING "requestCount"
  `);

  if ((rows[0]?.requestCount ?? input.limit + 1) > input.limit) {
    rejectRateLimit(Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)));
  }
}
