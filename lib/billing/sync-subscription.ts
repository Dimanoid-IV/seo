import "server-only";

import type Stripe from "stripe";

import { safeLogInfo } from "@/lib/logging";

import { getCurrentSubscription } from "./get-subscription";
import { normalizeBillingPlan } from "./plans";
import { reconcileLegacyBillingState } from "./stripe-legacy";
import { getStripeClient } from "./stripe";
import { persistStripeSubscription } from "./webhook";

async function findActiveStripeSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripeClient();
  if (!stripe) {
    return null;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  return (
    subscriptions.data.find((subscription) =>
      ["active", "trialing", "past_due"].includes(subscription.status)
    ) ??
    subscriptions.data[0] ??
    null
  );
}

export async function syncSubscriptionFromStripe(input: {
  userId: string;
  organizationId: string;
}) {
  const current = await getCurrentSubscription(input);
  const customerId = current.subscription.stripeCustomerId;

  if (!customerId) {
    return {
      synced: false as const,
      reason: "no_stripe_customer",
      plan: current.planKey,
    };
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return {
      synced: false as const,
      reason: "billing_not_configured",
      plan: current.planKey,
    };
  }

  try {
    await stripe.customers.retrieve(customerId);
  } catch {
    await reconcileLegacyBillingState(input);
    return {
      synced: false as const,
      reason: "legacy_stripe_customer",
      plan: "FREE",
    };
  }

  const stripeSubscription = await findActiveStripeSubscription(customerId);
  if (!stripeSubscription) {
    return {
      synced: false as const,
      reason: "no_stripe_subscription",
      plan: current.planKey,
    };
  }

  const result = await persistStripeSubscription({
    organizationId: input.organizationId,
    userId: input.userId,
    stripeSubscription,
  });

  safeLogInfo("billing.sync", "Subscription synced from Stripe", {
    organizationId: input.organizationId,
    subscriptionId: stripeSubscription.id,
    resolvedPlan: result.planKey,
    priceId: result.priceId,
  });

  return {
    synced: true as const,
    plan: result.planKey ?? normalizeBillingPlan(current.subscription.plan),
    subscriptionId: stripeSubscription.id,
  };
}
