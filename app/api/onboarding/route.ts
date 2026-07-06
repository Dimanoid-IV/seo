import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getLocaleFromRequest } from "@/lib/i18n/saas/server-locale";
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

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const locale = getLocaleFromRequest(request);
    const onboarding = await getOnboardingState(currentUser.id, locale);

    return authJsonResponse({ data: { onboarding } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
