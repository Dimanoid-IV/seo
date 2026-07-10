import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getLocaleFromRequest } from "@/lib/i18n/saas/server-locale";
import { prepareTaskFix } from "@/lib/review-queue/prepare-task-fix";

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
  regenerate: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { taskId } = await context.params;
    const locale = getLocaleFromRequest(request);

    let regenerate = false;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await parseJsonBody(request);
      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }
      regenerate = parsed.data.regenerate ?? false;
    }

    const result = await prepareTaskFix({
      taskId,
      currentUser,
      locale,
      regenerate,
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
