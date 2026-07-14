import "server-only";

import { getServerEnv } from "@/lib/env";

/**
 * Accepts only an explicit CRON_SECRET bearer token.
 * Header names that merely identify a cron request are not trusted because
 * public callers can spoof ordinary HTTP headers.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = getServerEnv().CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}
