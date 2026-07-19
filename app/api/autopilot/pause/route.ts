import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { pauseWebsiteLivePublish } from "@/lib/autopilot/live-publish-pause";
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

const bodySchema = z.object({
  websiteId: z.string().uuid().optional(),
  reason: z.string().max(500).optional().nullable(),
});

/**
 * POST /api/autopilot/pause — emergency pause live publish for one website.
 */
export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request).catch(() => ({}));
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const pause = await pauseWebsiteLivePublish({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: parsed.data.websiteId,
      reason: parsed.data.reason,
    });

    return authJsonResponse({
      data: {
        pause,
        message:
          "Live publishing is paused for this website. Drafts and review still work.",
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
