import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { generatePlanItemArticleDraft } from "@/lib/autopilot/generate-plan-article-draft";
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

const postSchema = z.object({
  itemId: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await generatePlanItemArticleDraft({
      planId: id,
      planItemId: parsed.data.itemId,
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
