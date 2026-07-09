import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { createCustomerPortalSession } from "@/lib/billing/customer-portal";
import { resolveOrganizationForBilling } from "@/lib/billing/get-subscription";
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

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const organization = await resolveOrganizationForBilling(
      currentUser.id,
      currentUser.organizationId
    );

    if (!organization) {
      throw new AppError(ErrorCode.NOT_FOUND, "Organization not found", {
        details: { billingError: "ONBOARDING_REQUIRED" },
      });
    }

    const result = await createCustomerPortalSession({
      userId: currentUser.id,
      organizationId: organization.id,
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
