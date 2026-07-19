import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { createCheckoutSession } from "@/lib/billing/checkout";
import { isStripeConfigured } from "@/lib/billing/errors";
import { resolveOrganizationForBilling } from "@/lib/billing/get-subscription";
import { billingError } from "@/lib/billing/errors";
import type { BillingPlanKey } from "@/lib/billing/plans";
import { trackEventFireAndForget } from "@/lib/analytics/track";
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

const checkoutSchema = z.object({
  plan: z.preprocess(
    (value) => (typeof value === "string" ? value.toUpperCase() : value),
    z.enum(["STARTER", "PRO", "AGENCY"])
  ),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    if (!isStripeConfigured()) {
      throw billingError(
        "BILLING_NOT_CONFIGURED",
        "Billing is not configured.",
        parsed.data.plan.toLowerCase()
      );
    }

    const organization = await resolveOrganizationForBilling(
      currentUser.id,
      currentUser.organizationId
    );

    if (!organization) {
      throw new AppError(ErrorCode.NOT_FOUND, "Organization not found", {
        details: { billingError: "ONBOARDING_REQUIRED" },
      });
    }

    const result = await createCheckoutSession({
      userId: currentUser.id,
      organizationId: organization.id,
      userEmail: currentUser.email,
      plan: parsed.data.plan as BillingPlanKey,
    });

    trackEventFireAndForget({
      event: "checkout_started",
      userId: currentUser.id,
      organizationId: organization.id,
      route: "/api/billing/checkout",
      properties: { plan: parsed.data.plan },
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
