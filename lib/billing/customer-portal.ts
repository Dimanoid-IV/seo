import "server-only";

import { billingError } from "./errors";
import { getBillingAppUrl, getStripeClient } from "./stripe";
import { getCurrentSubscription } from "./get-subscription";

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
      "BILLING_REQUIRED",
      "Billing is not configured yet.",
      current.planKey.toLowerCase()
    );
  }
  const appUrl = getBillingAppUrl();
  const returnUrl =
    process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL?.trim() ??
    `${appUrl}/app/billing`;

  const session = await stripe.billingPortal.sessions.create({
    customer: current.subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return { portalUrl: session.url };
}
