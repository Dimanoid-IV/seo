import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { applyOnboardingStepAction } from "@/lib/onboarding/complete-step";
import { getOnboardingState } from "@/lib/onboarding/get-onboarding-state";
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

const stepSchema = z.object({
  step: z.enum([
    "ADD_WEBSITE",
    "RUN_AUDIT",
    "CONNECT_GSC",
    "REVIEW_RESULTS",
    "GENERATE_PLAN",
    "COMPLETE",
  ]),
  action: z.enum(["COMPLETE", "SKIP", "VIEWED"]).optional().default("COMPLETE"),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = stepSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    await applyOnboardingStepAction({
      userId: currentUser.id,
      step: parsed.data.step,
      action: parsed.data.action,
    });

    const onboarding = await getOnboardingState(currentUser.id);
    return authJsonResponse({ data: { onboarding } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
