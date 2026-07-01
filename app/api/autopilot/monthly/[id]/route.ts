import { MonthlyAutopilotStatus } from "@prisma/client";
import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { updateMonthlyAutopilotPlan } from "@/lib/autopilot/update-monthly-plan";
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

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  summary: z.string().max(5000).optional(),
  status: z
    .enum(["DRAFT", "READY", "APPROVED"])
    .optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const plan = await updateMonthlyAutopilotPlan({
      planId: id,
      userId: currentUser.id,
      data: {
        title: parsed.data.title,
        summary: parsed.data.summary,
        status: parsed.data.status as MonthlyAutopilotStatus | undefined,
      },
    });

    return authJsonResponse({ data: plan });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
