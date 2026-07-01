import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { markTimelineEventsRead } from "@/lib/timeline/get-timeline";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

const markReadSchema = z.object({
  websiteId: z.string().uuid().optional(),
  eventIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const body = markReadSchema.parse(await request.json());
    const result = await markTimelineEventsRead({
      currentUser,
      websiteId: body.websiteId,
      eventIds: body.eventIds,
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
