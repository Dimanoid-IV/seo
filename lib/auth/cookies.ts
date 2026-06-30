import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { assertServerOnly } from "@/lib/security";

/** HttpOnly refresh cookie name (API-Design.md). */
export const REFRESH_TOKEN_COOKIE_NAME = "rb_refresh";

/** 30 days in seconds. */
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

export type RefreshTokenCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

export function getRefreshTokenCookieOptions(): RefreshTokenCookieOptions {
  assertServerOnly();
  const isProduction = getServerEnv().NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  };
}

/**
 * Sets the refresh token on the mutable cookie store (Server Actions, Route Handlers).
 */
export async function setRefreshTokenCookie(token: string): Promise<void> {
  assertServerOnly();
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, token, getRefreshTokenCookieOptions());
}

/**
 * Sets the refresh token on a NextResponse (Route Handlers returning JSON).
 */
export function setRefreshTokenCookieOnResponse(
  response: NextResponse,
  token: string
): NextResponse {
  assertServerOnly();
  response.cookies.set(
    REFRESH_TOKEN_COOKIE_NAME,
    token,
    getRefreshTokenCookieOptions()
  );
  return response;
}

/**
 * Clears the refresh token from the mutable cookie store.
 */
export async function clearRefreshTokenCookie(): Promise<void> {
  assertServerOnly();
  const cookieStore = await cookies();
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
}

/**
 * Clears the refresh token on a NextResponse.
 */
export function clearRefreshTokenCookieOnResponse(
  response: NextResponse
): NextResponse {
  assertServerOnly();
  response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
  return response;
}

/**
 * Reads the refresh token from request cookies.
 */
export async function getRefreshTokenFromCookies(): Promise<string | undefined> {
  assertServerOnly();
  const cookieStore = await cookies();
  const value = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  return value?.trim() || undefined;
}
