import "server-only";

import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

/**
 * Ensures DATABASE_URL and JWT secrets are configured for SaaS auth routes.
 */
export function assertSaasConfigured(): void {
  const env = getServerEnv();

  if (!env.DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured. Set DATABASE_URL in .env.local.",
      { statusCode: 503 }
    );
  }

  if (!env.JWT_ACCESS_SECRET?.trim() || !env.JWT_REFRESH_SECRET?.trim()) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Auth is not configured. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env.local.",
      { statusCode: 503 }
    );
  }
}
