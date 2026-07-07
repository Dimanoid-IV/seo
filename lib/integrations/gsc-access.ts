import "server-only";

import { AppError, ErrorCode } from "@/lib/errors";

import { refreshGscIntegrationAccessToken } from "@/lib/google/token-refresh";

function isTokenExpiredError(error: unknown): boolean {
  return (
    error instanceof AppError &&
    error.code === ErrorCode.INTEGRATION_ERROR &&
    typeof error.details === "object" &&
    error.details !== null &&
    "reason" in error.details &&
    error.details.reason === "token_expired"
  );
}

/**
 * Calls a GSC API function with the current access token.
 * On token_expired, refreshes once and retries.
 */
export async function withGscAccessToken<T>(
  integrationId: string,
  accessToken: string,
  callback: (token: string) => Promise<T>
): Promise<T> {
  try {
    return await callback(accessToken);
  } catch (error) {
    if (!isTokenExpiredError(error)) {
      throw error;
    }

    const refreshed = await refreshGscIntegrationAccessToken(integrationId);
    return callback(refreshed);
  }
}
