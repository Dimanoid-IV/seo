import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { createWebsiteForOnboarding } from "@/lib/onboarding/create-website";
import { applyOnboardingStepAction } from "@/lib/onboarding/complete-step";
import { getOnboardingState } from "@/lib/onboarding/get-onboarding-state";
import { scheduleWebsiteActivation } from "@/lib/onboarding/schedule-activation";
import { trackEventFireAndForget } from "@/lib/analytics/track";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

export const maxDuration = 60;

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

const websiteSchema = z.object({
  url: z.string().trim().min(3).max(500),
  displayName: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = websiteSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const website = await createWebsiteForOnboarding({
      userId: currentUser.id,
      url: parsed.data.url,
      displayName: parsed.data.displayName,
    });

    await applyOnboardingStepAction({
      userId: currentUser.id,
      step: "ADD_WEBSITE",
      action: "COMPLETE",
    });

    await scheduleWebsiteActivation({
      userId: currentUser.id,
      organizationId: website.organizationId,
      websiteId: website.id,
      websiteUrl: website.url,
    });

    trackEventFireAndForget({
      event: "website_added",
      userId: currentUser.id,
      organizationId: website.organizationId,
      websiteId: website.id,
      route: "/app/onboarding",
      properties: { source: "onboarding" },
    });

    const onboarding = await getOnboardingState(currentUser.id);
    return authJsonResponse({
      data: {
        onboarding,
        website: {
          id: website.id,
          url: website.url,
          displayName: website.displayName,
        },
        activationStarted: true,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
