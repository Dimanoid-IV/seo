import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { resumeWebsiteLivePublish } from "@/lib/autopilot/live-publish-pause";
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
});

/**
 * POST /api/autopilot/resume — clear per-website live publish pause.
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

    const pause = await resumeWebsiteLivePublish({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: parsed.data.websiteId,
    });

    return authJsonResponse({
      data: {
        pause,
        message:
          "Live publishing pause cleared. Global kill switch and plan gates still apply.",
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
