import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { z } from "zod";

import { getRequiredEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { assertServerOnly } from "@/lib/security";

import type { AuthTokenClaims, AuthTokenPayload } from "./types";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;

const authRoleSchema = z.enum(["user", "support", "analyst", "admin"]);
const authLocaleSchema = z.enum(["ru", "et", "en"]);

const tokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  role: authRoleSchema,
  locale: authLocaleSchema,
});

function getAccessSecret(): Uint8Array {
  return new TextEncoder().encode(getRequiredEnv("JWT_ACCESS_SECRET"));
}

function getRefreshSecret(): Uint8Array {
  return new TextEncoder().encode(getRequiredEnv("JWT_REFRESH_SECRET"));
}

function parseVerifiedPayload(payload: JWTPayload): AuthTokenPayload {
  const organizationId =
    payload.organizationId === null || payload.organizationId === undefined
      ? null
      : String(payload.organizationId);

  const parsed = tokenPayloadSchema.safeParse({
    userId: payload.userId,
    organizationId,
    role: payload.role,
    locale: payload.locale,
  });

  if (!parsed.success) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid token payload", {
      details: { issues: parsed.error.issues },
    });
  }

  return {
    ...parsed.data,
    iat: payload.iat,
    exp: payload.exp,
  };
}

function toJwtClaims(claims: AuthTokenClaims): Record<string, unknown> {
  return {
    userId: claims.userId,
    organizationId: claims.organizationId,
    role: claims.role,
    locale: claims.locale,
  };
}

/**
 * Creates a short-lived access JWT (15 minutes).
 */
export async function createAccessToken(
  claims: AuthTokenClaims
): Promise<{ token: string; expiresIn: number }> {
  assertServerOnly();

  const token = await new SignJWT(toJwtClaims(claims))
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getAccessSecret());

  return { token, expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS };
}

/**
 * Creates a long-lived refresh JWT (30 days).
 */
export async function createRefreshToken(claims: AuthTokenClaims): Promise<string> {
  assertServerOnly();

  return new SignJWT(toJwtClaims(claims))
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(getRefreshSecret());
}

/**
 * Verifies an access JWT and returns its payload.
 */
export async function verifyAccessToken(token: string): Promise<AuthTokenPayload> {
  assertServerOnly();

  try {
    const { payload } = await jwtVerify(token, getAccessSecret(), {
      algorithms: ["HS256"],
    });
    return parseVerifiedPayload(payload);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Недействительный или просроченный access token",
      { cause: error }
    );
  }
}

/**
 * Verifies a refresh JWT and returns its payload.
 */
export async function verifyRefreshToken(token: string): Promise<AuthTokenPayload> {
  assertServerOnly();

  try {
    const { payload } = await jwtVerify(token, getRefreshSecret(), {
      algorithms: ["HS256"],
    });
    return parseVerifiedPayload(payload);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Недействительный или просроченный refresh token",
      { cause: error }
    );
  }
}
