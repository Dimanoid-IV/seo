import { getRequiredEnv, getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { assertServerOnly } from "@/lib/security";

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

/**
 * Resolves Google Integrations OAuth credentials.
 * Prefers GOOGLE_CLIENT_* (prompt 8.3), falls back to GOOGLE_INTEGRATIONS_*.
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  assertServerOnly();

  const env = getServerEnv();
  const clientId =
    env.GOOGLE_CLIENT_ID?.trim() || env.GOOGLE_INTEGRATIONS_CLIENT_ID?.trim();
  const clientSecret =
    env.GOOGLE_CLIENT_SECRET?.trim() ||
    env.GOOGLE_INTEGRATIONS_CLIENT_SECRET?.trim();
  const redirectUri =
    env.GOOGLE_REDIRECT_URI?.trim() ||
    env.GOOGLE_INTEGRATIONS_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Google OAuth не настроен. Установите GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET и GOOGLE_REDIRECT_URI."
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function getGoogleOAuthRedirectUri(): string {
  return getGoogleOAuthConfig().redirectUri;
}

export function requireGoogleOAuthClientId(): string {
  const clientId =
    getServerEnv().GOOGLE_CLIENT_ID?.trim() ||
    getServerEnv().GOOGLE_INTEGRATIONS_CLIENT_ID?.trim();

  if (!clientId) {
    return getRequiredEnv("GOOGLE_CLIENT_ID");
  }

  return clientId;
}
