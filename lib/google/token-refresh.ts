import "server-only";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { getGoogleOAuthConfig } from "@/lib/google/config";
import type { GoogleTokenResponse } from "@/lib/google/oauth";
import { encryptSecret, decryptSecret } from "@/lib/security/encryption";
import { assertServerOnly } from "@/lib/security";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Exchanges a refresh token for a new Google access token.
 */
export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<GoogleTokenResponse> {
  assertServerOnly();

  const { clientId, clientSecret } = getGoogleOAuthConfig();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      "Could not refresh Google access token. Reconnect Google Search Console.",
      { details: { reason: "token_refresh_failed" } }
    );
  }

  const data = (await response.json()) as GoogleTokenResponse;

  if (!data.access_token) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      "Google did not return a new access token.",
      { details: { reason: "token_refresh_failed" } }
    );
  }

  return data;
}

/**
 * Refreshes and persists a new access token for a GSC integration.
 */
export async function refreshGscIntegrationAccessToken(
  integrationId: string
): Promise<string> {
  const prisma = getPrisma();

  const integration = await prisma.integration.findUnique({
    where: { id: integrationId },
    select: {
      id: true,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
    },
  });

  if (!integration?.refreshTokenEncrypted) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      "Google Search Console refresh token is missing. Reconnect the integration.",
      { details: { reason: "missing_refresh_token" } }
    );
  }

  let refreshToken: string;
  try {
    refreshToken = decryptSecret(integration.refreshTokenEncrypted);
  } catch (error) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      "Could not decrypt Google refresh token.",
      { cause: error }
    );
  }

  const tokens = await refreshGoogleAccessToken(refreshToken);
  const accessTokenEncrypted = encryptSecret(tokens.access_token);

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessTokenEncrypted,
      lastSuccessAt: new Date(),
      lastErrorAt: null,
      lastErrorMessage: null,
    },
  });

  return tokens.access_token;
}
