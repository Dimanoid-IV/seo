import "server-only";

import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import type Stripe from "stripe";

import { monthPeriod } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";

import { billingError } from "./errors";
import { getCurrentSubscription } from "./get-subscription";
import { normalizeBillingPlan } from "./plans";
import { getStripeClient } from "./stripe";
import { syncPlanLimitsFromConfig } from "./usage";

export function isStripeResourceMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const stripeError = error as Stripe.errors.StripeError;
  return stripeError.code === "resource_missing";
}

export async function stripeCustomerExists(customerId: string): Promise<boolean> {
  const stripe = getStripeClient();
  if (!stripe) {
    return false;
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    return !("deleted" in customer && customer.deleted);
  } catch (error) {
    if (isStripeResourceMissingError(error)) {
      return false;
    }
    throw error;
  }
}

export async function stripeSubscriptionExists(
  subscriptionId: string
): Promise<boolean> {
  const stripe = getStripeClient();
  if (!stripe) {
    return false;
  }

  try {
    await stripe.subscriptions.retrieve(subscriptionId);
    return true;
  } catch (error) {
    if (isStripeResourceMissingError(error)) {
      return false;
    }
    throw error;
  }
}

export async function reconcileLegacyBillingState(input: {
  userId: string;
  organizationId: string;
}): Promise<{ repaired: boolean; reason?: string }> {
  const current = await getCurrentSubscription(input);
  const subscription = current.subscription;
  const hasStripeRefs = Boolean(
    subscription.stripeCustomerId || subscription.stripeSubscriptionId
  );
  const isPaidPlan = subscription.plan !== SubscriptionPlan.FREE;

  if (!hasStripeRefs && !isPaidPlan) {
    return { repaired: false };
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return { repaired: false };
  }

  let customerValid = true;
  let subscriptionValid = true;

  if (subscription.stripeCustomerId) {
    customerValid = await stripeCustomerExists(subscription.stripeCustomerId);
  } else if (isPaidPlan) {
    customerValid = false;
  }

  if (subscription.stripeSubscriptionId) {
    subscriptionValid = await stripeSubscriptionExists(
      subscription.stripeSubscriptionId
    );
  } else if (isPaidPlan) {
    subscriptionValid = false;
  }

  if (customerValid && subscriptionValid) {
    return { repaired: false };
  }

  const prisma = getPrisma();
  const { start, end } = monthPeriod();
  const now = new Date();

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.CANCELED,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      canceledAt: now,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      trialEndsAt: null,
    },
  });

  await syncPlanLimitsFromConfig({
    organizationId: input.organizationId,
    subscriptionId: subscription.id,
    planKey: "FREE",
  });

  return {
    repaired: true,
    reason: "legacy_stripe_ids",
  };
}

export async function assertLiveStripeCustomer(input: {
  userId: string;
  organizationId: string;
  customerId: string;
  plan: string;
}): Promise<string> {
  const exists = await stripeCustomerExists(input.customerId);
  if (exists) {
    return input.customerId;
  }

  await reconcileLegacyBillingState({
    userId: input.userId,
    organizationId: input.organizationId,
  });

  throw billingError(
    "BILLING_STATE_LEGACY_OR_INVALID",
    "This subscription was created in test mode. Choose a plan again to enable live billing.",
    input.plan
  );
}
