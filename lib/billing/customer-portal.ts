import "server-only";

import { billingError } from "./errors";
import { getBillingAppUrl, getStripeClient } from "./stripe";
import { getCurrentSubscription } from "./get-subscription";
import {
  assertLiveStripeCustomer,
  isStripeResourceMissingError,
  reconcileLegacyBillingState,
} from "./stripe-legacy";

export async function createCustomerPortalSession(input: {
  userId: string;
  organizationId: string;
}) {
  const current = await getCurrentSubscription(input);

  if (!current.subscription.stripeCustomerId) {
    throw billingError(
      "BILLING_REQUIRED",
      "No Stripe customer found. Upgrade to a paid plan first.",
      current.planKey.toLowerCase()
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    throw billingError(
      "BILLING_NOT_CONFIGURED",
      "Billing is not configured.",
      current.planKey.toLowerCase()
    );
  }

  const customerId = await assertLiveStripeCustomer({
    userId: input.userId,
    organizationId: input.organizationId,
    customerId: current.subscription.stripeCustomerId,
    plan: current.planKey.toLowerCase(),
  });

  const appUrl = getBillingAppUrl();
  const returnUrl =
    process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL?.trim() ??
    `${appUrl}/app/billing`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { portalUrl: session.url };
  } catch (error) {
    if (isStripeResourceMissingError(error)) {
      await reconcileLegacyBillingState(input);
      throw billingError(
        "BILLING_STATE_LEGACY_OR_INVALID",
        "This subscription was created in test mode. Choose a plan again to enable live billing.",
        current.planKey.toLowerCase()
      );
    }

    throw billingError(
      "BILLING_PORTAL_UNAVAILABLE",
      "Billing portal is temporarily unavailable.",
      current.planKey.toLowerCase()
    );
  }
}
