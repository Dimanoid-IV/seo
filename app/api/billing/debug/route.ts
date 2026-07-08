import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
} from "@/lib/auth/responses";
import {
  getCurrentSubscription,
  resolveOrganizationForBilling,
} from "@/lib/billing/get-subscription";
import { isStripeConfigured } from "@/lib/billing/errors";
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
    const organization = await resolveOrganizationForBilling(
      currentUser.id,
      currentUser.organizationId
    );

    if (!organization) {
      throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
    }

    const current = await getCurrentSubscription({
      userId: currentUser.id,
      organizationId: organization.id,
    });

    const env = getServerEnv();

    return authJsonResponse({
      data: {
        userId: currentUser.id,
        organizationId: organization.id,
        subscription: {
          id: current.subscription.id,
          plan: current.planKey,
          status: current.subscription.status,
          stripeCustomerId: current.subscription.stripeCustomerId,
          stripeSubscriptionId: current.subscription.stripeSubscriptionId,
          stripePriceId: current.subscription.stripePriceId,
          currentPeriodStart: current.subscription.currentPeriodStart,
          currentPeriodEnd: current.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: current.subscription.cancelAtPeriodEnd,
          updatedAt: current.subscription.updatedAt,
        },
        stripeConfigured: isStripeConfigured(),
        configuredPriceIds: {
          starter: Boolean(env.STRIPE_STARTER_PRICE_ID?.trim()),
          pro: Boolean(env.STRIPE_PRO_PRICE_ID?.trim()),
          agency: Boolean(env.STRIPE_AGENCY_PRICE_ID?.trim()),
        },
        webhookSecretConfigured: Boolean(env.STRIPE_WEBHOOK_SECRET?.trim()),
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
