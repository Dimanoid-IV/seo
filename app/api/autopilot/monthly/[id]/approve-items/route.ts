import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { approveSelectedPlanItems } from "@/lib/autopilot/approve-plan-items";
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
  itemIds: z.array(z.string().min(1)).min(1),
  period: z.enum(["weekly", "monthly"]).optional(),
  publishingMode: z.enum(["REVIEW_ONLY", "AUTO_PUBLISH"]).optional(),
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

    const result = await approveSelectedPlanItems({
      planId: id,
      userId: currentUser.id,
      itemIds: parsed.data.itemIds,
      period: parsed.data.period,
      publishingMode: parsed.data.publishingMode,
      timezone: null,
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
