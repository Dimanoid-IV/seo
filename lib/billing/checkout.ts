import "server-only";

import { billingPlanToSubscriptionPlan } from "./get-subscription";
import { billingError } from "./errors";
import {
  getStripePriceIdForPlan,
  type BillingPlanKey,
} from "./plans";
import { getBillingAppUrl, getStripeClient } from "./stripe";
import { getCurrentSubscription } from "./get-subscription";

export async function createCheckoutSession(input: {
  userId: string;
  organizationId: string;
  userEmail: string;
  plan: BillingPlanKey;
}) {
  if (input.plan === "FREE") {
    throw billingError(
      "BILLING_REQUIRED",
      "Free plan does not require checkout.",
      "free"
    );
  }

  const priceId = getStripePriceIdForPlan(input.plan);
  if (!priceId) {
    throw billingError(
      "BILLING_REQUIRED",
      "Billing is not configured yet.",
      input.plan.toLowerCase()
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    throw billingError(
      "BILLING_REQUIRED",
      "Billing is not configured yet.",
      input.plan.toLowerCase()
    );
  }
  const current = await getCurrentSubscription({
    userId: input.userId,
    organizationId: input.organizationId,
  });

  let customerId = current.subscription.stripeCustomerId;

  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: input.userEmail,
        metadata: {
          userId: input.userId,
          organizationId: input.organizationId,
        },
      });
      customerId = customer.id;
    } catch {
      throw billingError(
        "BILLING_REQUIRED",
        "Could not create checkout session.",
        input.plan.toLowerCase()
      );
    }

    const prisma = (await import("@/lib/db")).getPrisma();
    await prisma.subscription.update({
      where: { id: current.subscription.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = getBillingAppUrl();

  let session;
  try {
    session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/app/billing?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    metadata: {
      userId: input.userId,
      organizationId: input.organizationId,
      plan: input.plan,
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
        organizationId: input.organizationId,
        plan: input.plan,
      },
    },
  });
  } catch {
    throw billingError(
      "BILLING_REQUIRED",
      "Could not create checkout session.",
      input.plan.toLowerCase()
    );
  }

  if (!session.url) {
    throw billingError(
      "BILLING_REQUIRED",
      "Could not create checkout session.",
      input.plan.toLowerCase()
    );
  }

  return { checkoutUrl: session.url };
}

export { billingPlanToSubscriptionPlan };
