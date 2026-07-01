import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { generateMonthlyAutopilotPlan } from "@/lib/autopilot/generate-monthly-plan";
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

const generateSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  websiteId: z.string().uuid().optional(),
  forceRegenerate: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await generateMonthlyAutopilotPlan({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: parsed.data.websiteId,
      month: parsed.data.month,
      forceRegenerate: parsed.data.forceRegenerate ?? false,
    });

    return authJsonResponse({
      data: {
        plan: result.plan,
        created: result.created,
        hermesSummaryUsed: result.hermesSummaryUsed,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
