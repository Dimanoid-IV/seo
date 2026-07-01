import { SignJWT, jwtVerify } from "jose";

import { getRequiredEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { generateToken } from "@/lib/security";
import { assertServerOnly } from "@/lib/security";

import { getGoogleOAuthConfig } from "./config";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export const GSC_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/webmasters.readonly",
] as const;

const OAUTH_STATE_TTL = "10m";

export type GoogleOAuthStatePayload = {
  userId: string;
  websiteId: string;
  organizationId: string;
  provider: "google_search_console";
  nonce: string;
};

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

export type GoogleUserProfile = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function getOAuthStateSecret(): Uint8Array {
  return new TextEncoder().encode(getRequiredEnv("JWT_ACCESS_SECRET"));
}

/**
 * Builds the Google OAuth authorization URL for Search Console connect.
 */
export function buildGoogleOAuthUrl(state: string): string {
  assertServerOnly();

  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GSC_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Signs OAuth state for CSRF protection and website binding.
 */
export async function createGoogleOAuthState(
  payload: Omit<GoogleOAuthStatePayload, "nonce">
): Promise<string> {
  assertServerOnly();

  const nonce = generateToken("gsc_oauth");

  return new SignJWT({
    ...payload,
    nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(OAUTH_STATE_TTL)
    .sign(getOAuthStateSecret());
}

/**
 * Verifies signed OAuth state from Google callback.
 */
export async function verifyGoogleOAuthState(
  state: string
): Promise<GoogleOAuthStatePayload> {
  assertServerOnly();

  try {
    const { payload } = await jwtVerify(state, getOAuthStateSecret(), {
      algorithms: ["HS256"],
    });

    const userId = String(payload.userId ?? "");
    const websiteId = String(payload.websiteId ?? "");
    const organizationId = String(payload.organizationId ?? "");
    const provider = String(payload.provider ?? "");
    const nonce = String(payload.nonce ?? "");

    if (
      !userId ||
      !websiteId ||
      !organizationId ||
      provider !== "google_search_console" ||
      !nonce
    ) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Некорректный OAuth state");
    }

    return {
      userId,
      websiteId,
      organizationId,
      provider: "google_search_console",
      nonce,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Недействительный или просроченный OAuth state",
      { cause: error }
    );
  }
}

/**
 * Exchanges an authorization code for Google OAuth tokens.
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleTokenResponse> {
  assertServerOnly();

  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось обменять OAuth code на токены Google"
    );
  }

  const data = (await response.json()) as GoogleTokenResponse;

  if (!data.access_token) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Google не вернул access token"
    );
  }

  return data;
}

/**
 * Loads the authenticated Google account profile.
 */
export async function getGoogleUser(
  accessToken: string
): Promise<GoogleUserProfile> {
  assertServerOnly();

  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось получить профиль Google"
    );
  }

  return (await response.json()) as GoogleUserProfile;
}
