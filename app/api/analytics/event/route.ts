import { z } from "zod";

import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { trackEvent } from "@/lib/analytics/track";
import { isProductEventName } from "@/lib/analytics/types";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

const eventSchema = z.object({
  event: z.string().trim().min(2).max(80),
  route: z.string().trim().max(200).optional(),
  locale: z.string().trim().max(16).optional(),
  websiteId: z.string().uuid().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Public analytics ingest — works for anonymous visitors and logged-in users.
 * Server always sanitizes properties; never trusts client blindly.
 */
export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const body = await parseJsonBody(request);
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const eventName = parsed.data.event;
    if (
      !isProductEventName(eventName) &&
      !/^[a-z][a-z0-9_]{1,78}$/.test(eventName)
    ) {
      return authJsonResponse({ data: { ok: true, skipped: true } });
    }

    let userId: string | null = null;
    let organizationId: string | null = null;
    try {
      const user = await getCurrentUserFromRequest(request);
      if (user) {
        userId = user.id;
        organizationId = user.organizationId ?? null;
      }
    } catch {
      // anonymous ok
    }

    await trackEvent({
      event: eventName,
      userId,
      organizationId,
      websiteId: parsed.data.websiteId ?? null,
      route: parsed.data.route ?? null,
      locale: parsed.data.locale ?? null,
      properties: parsed.data.properties ?? null,
    });

    return authJsonResponse({ data: { ok: true } });
  } catch (error) {
    if (
      error instanceof AppError &&
      error.code === ErrorCode.VALIDATION_ERROR
    ) {
      return authErrorResponse(request, error);
    }
    return authJsonResponse({ data: { ok: true, softFailed: true } });
  }
}
