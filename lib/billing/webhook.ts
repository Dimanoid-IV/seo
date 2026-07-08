import "server-only";

import {
  PaymentStatus,
  PaymentType,
  SubscriptionStatus,
  type SubscriptionPlan,
} from "@prisma/client";
import type Stripe from "stripe";

import { getPrisma } from "@/lib/db";
import { safeLogInfo, safeLogWarn } from "@/lib/logging";

import {
  billingPlanToSubscriptionPlan,
  ensureSubscription,
  updateSubscriptionPlan,
} from "./get-subscription";
import {
  planFromMetadata,
  planFromStripePriceId,
  type BillingPlanKey,
} from "./plans";
import { timelineAfterSubscriptionUpdated } from "./hooks";

export type StripeWebhookDiagnostic = {
  eventType: string;
  checkoutSessionId?: string;
  subscriptionId?: string;
  customerId?: string;
  metadataKeys: string[];
  userIdPresent: boolean;
  organizationIdPresent: boolean;
  priceId?: string;
  resolvedPlan?: BillingPlanKey | null;
  dbUpdateAttempted: boolean;
  dbUpdateSuccess: boolean;
  errorMessage?: string;
};

function logWebhookDiagnostic(diagnostic: StripeWebhookDiagnostic): void {
  safeLogInfo("billing.webhook", "Stripe webhook diagnostic", {
    eventType: diagnostic.eventType,
    checkoutSessionId: diagnostic.checkoutSessionId,
    subscriptionId: diagnostic.subscriptionId,
    customerId: diagnostic.customerId,
    metadataKeys: diagnostic.metadataKeys,
    userIdPresent: diagnostic.userIdPresent,
    organizationIdPresent: diagnostic.organizationIdPresent,
    priceId: diagnostic.priceId,
    resolvedPlan: diagnostic.resolvedPlan ?? null,
    dbUpdateAttempted: diagnostic.dbUpdateAttempted,
    dbUpdateSuccess: diagnostic.dbUpdateSuccess,
    errorMessage: diagnostic.errorMessage,
  });
}

function metadataKeys(metadata: Stripe.Metadata | null | undefined): string[] {
  return metadata ? Object.keys(metadata) : [];
}

function getStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) {
    return null;
  }

  if (typeof customer === "string") {
    return customer;
  }

  if ("deleted" in customer && customer.deleted) {
    return null;
  }

  return customer.id;
}

function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
} {
  const item = subscription.items.data[0];
  const startSeconds =
    item?.current_period_start ??
    (subscription as Stripe.Subscription & { current_period_start?: number })
      .current_period_start;
  const endSeconds =
    item?.current_period_end ??
    (subscription as Stripe.Subscription & { current_period_end?: number })
      .current_period_end;

  return {
    currentPeriodStart: startSeconds ? new Date(startSeconds * 1000) : null,
    currentPeriodEnd: endSeconds ? new Date(endSeconds * 1000) : null,
  };
}

function resolvePlanFromStripeSubscription(
  subscription: Stripe.Subscription
): BillingPlanKey | null {
  const priceId = subscription.items.data[0]?.price.id;
  return (
    (priceId ? planFromStripePriceId(priceId) : null) ??
    planFromMetadata(subscription.metadata?.plan)
  );
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "unpaid":
      return SubscriptionStatus.UNPAID;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  const prisma = getPrisma();
  const existing = await prisma.payment.findFirst({
    where: { stripeEventId: eventId },
    select: { id: true },
  });
  return Boolean(existing);
}

async function markEventProcessed(input: {
  eventId: string;
  organizationId: string;
  userId?: string | null;
  amountCents?: number;
}) {
  const prisma = getPrisma();
  await prisma.payment.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      stripeEventId: input.eventId,
      amountCents: input.amountCents ?? 0,
      status: PaymentStatus.PAID,
      type: PaymentType.SUBSCRIPTION,
      paidAt: new Date(),
    },
  });
}

export async function persistStripeSubscription(input: {
  organizationId: string;
  userId?: string | null;
  stripeSubscription: Stripe.Subscription;
}): Promise<{
  planKey: BillingPlanKey | null;
  priceId?: string;
  updated: boolean;
}> {
  const subscriptionItem = input.stripeSubscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const planKey = resolvePlanFromStripeSubscription(input.stripeSubscription);
  const plan: SubscriptionPlan = planKey
    ? billingPlanToSubscriptionPlan(planKey)
    : billingPlanToSubscriptionPlan("STARTER");

  if (input.userId) {
    await ensureSubscription({
      userId: input.userId,
      organizationId: input.organizationId,
    });
  }

  const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(
    input.stripeSubscription
  );

  const updated = await updateSubscriptionPlan({
    organizationId: input.organizationId,
    plan,
    status: mapStripeStatus(input.stripeSubscription.status),
    stripeCustomerId: getStripeCustomerId(input.stripeSubscription.customer),
    stripeSubscriptionId: input.stripeSubscription.id,
    stripePriceId: priceId ?? null,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: input.stripeSubscription.cancel_at_period_end,
  });

  if (!updated) {
    throw new Error("Subscription row not found for organization");
  }

  if (input.userId && planKey) {
    try {
      await timelineAfterSubscriptionUpdated({
        userId: input.userId,
        websiteId: null,
        organizationId: input.organizationId,
        plan: planKey,
      });
    } catch {
      // Timeline must not block webhook processing.
    }
  }

  return {
    planKey,
    priceId,
    updated: true,
  };
}

async function applyStripeSubscription(input: {
  organizationId: string;
  userId?: string | null;
  stripeSubscription: Stripe.Subscription;
  eventId: string;
  diagnostic: StripeWebhookDiagnostic;
}) {
  input.diagnostic.dbUpdateAttempted = true;

  try {
    const result = await persistStripeSubscription({
      organizationId: input.organizationId,
      userId: input.userId,
      stripeSubscription: input.stripeSubscription,
    });

    input.diagnostic.priceId = result.priceId;
    input.diagnostic.resolvedPlan = result.planKey;
    input.diagnostic.dbUpdateSuccess = true;

    await markEventProcessed({
      eventId: input.eventId,
      organizationId: input.organizationId,
      userId: input.userId,
    });
  } catch (error) {
    input.diagnostic.dbUpdateSuccess = false;
    input.diagnostic.errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw error;
  }
}

async function resolveOrganizationIdForSubscription(
  subscription: Stripe.Subscription
): Promise<{ organizationId: string | null; userId: string | null }> {
  const prisma = getPrisma();
  const metadataOrganizationId = subscription.metadata?.organizationId ?? null;
  const metadataUserId = subscription.metadata?.userId ?? null;

  if (metadataOrganizationId) {
    return {
      organizationId: metadataOrganizationId,
      userId: metadataUserId,
    };
  }

  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    select: { organizationId: true, userId: true },
  });

  if (existing) {
    return {
      organizationId: existing.organizationId,
      userId: existing.userId,
    };
  }

  const customerId = getStripeCustomerId(subscription.customer);
  if (!customerId) {
    return { organizationId: null, userId: null };
  }

  const byCustomer = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { organizationId: true, userId: true },
  });

  return {
    organizationId: byCustomer?.organizationId ?? null,
    userId: byCustomer?.userId ?? null,
  };
}

async function retrieveActiveSubscriptionForCustomer(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const stripe = (await import("./stripe")).requireStripeClient();
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

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  if (await isEventProcessed(event.id)) {
    return { processed: false, reason: "duplicate" };
  }

  const prisma = getPrisma();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId ?? null;
      const userId = session.metadata?.userId ?? null;
      const diagnostic: StripeWebhookDiagnostic = {
        eventType: event.type,
        checkoutSessionId: session.id,
        subscriptionId:
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id,
        customerId: getStripeCustomerId(session.customer) ?? undefined,
        metadataKeys: metadataKeys(session.metadata),
        userIdPresent: Boolean(userId),
        organizationIdPresent: Boolean(organizationId),
        dbUpdateAttempted: false,
        dbUpdateSuccess: false,
      };

      if (!organizationId) {
        diagnostic.errorMessage = "missing_organization";
        logWebhookDiagnostic(diagnostic);
        return { processed: false, reason: "missing_organization" };
      }

      try {
        const stripe = (await import("./stripe")).requireStripeClient();
        let stripeSubscription: Stripe.Subscription | null = null;

        if (typeof session.subscription === "string") {
          stripeSubscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
        } else if (session.subscription && typeof session.subscription === "object") {
          stripeSubscription = session.subscription;
        } else {
          const customerId = getStripeCustomerId(session.customer);
          if (customerId) {
            stripeSubscription =
              await retrieveActiveSubscriptionForCustomer(customerId);
          }
        }

        if (!stripeSubscription) {
          diagnostic.errorMessage = "missing_subscription";
          logWebhookDiagnostic(diagnostic);
          safeLogWarn(
            "billing.webhook",
            "Checkout completed without retrievable subscription",
            {
              checkoutSessionId: session.id,
              organizationId,
            }
          );
          return { processed: false, reason: "missing_subscription" };
        }

        diagnostic.subscriptionId = stripeSubscription.id;
        diagnostic.metadataKeys = metadataKeys(stripeSubscription.metadata);
        diagnostic.userIdPresent = Boolean(userId ?? stripeSubscription.metadata?.userId);
        diagnostic.organizationIdPresent = true;

        await applyStripeSubscription({
          organizationId,
          userId: userId ?? stripeSubscription.metadata?.userId ?? null,
          stripeSubscription,
          eventId: event.id,
          diagnostic,
        });

        logWebhookDiagnostic(diagnostic);
        return { processed: true };
      } catch (error) {
        diagnostic.errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logWebhookDiagnostic(diagnostic);
        throw error;
      }
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const resolved = await resolveOrganizationIdForSubscription(subscription);
      const diagnostic: StripeWebhookDiagnostic = {
        eventType: event.type,
        subscriptionId: subscription.id,
        customerId: getStripeCustomerId(subscription.customer) ?? undefined,
        metadataKeys: metadataKeys(subscription.metadata),
        userIdPresent: Boolean(resolved.userId ?? subscription.metadata?.userId),
        organizationIdPresent: Boolean(resolved.organizationId),
        dbUpdateAttempted: false,
        dbUpdateSuccess: false,
      };

      if (!resolved.organizationId) {
        diagnostic.errorMessage = "missing_organization";
        logWebhookDiagnostic(diagnostic);
        return { processed: false, reason: "missing_organization" };
      }

      try {
        await applyStripeSubscription({
          organizationId: resolved.organizationId,
          userId: resolved.userId ?? subscription.metadata?.userId ?? null,
          stripeSubscription: subscription,
          eventId: event.id,
          diagnostic,
        });

        logWebhookDiagnostic(diagnostic);
        return { processed: true };
      } catch (error) {
        diagnostic.errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logWebhookDiagnostic(diagnostic);
        throw error;
      }
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const row = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (!row) {
        return { processed: false, reason: "subscription_not_found" };
      }

      await updateSubscriptionPlan({
        organizationId: row.organizationId,
        plan: billingPlanToSubscriptionPlan("FREE"),
        status: SubscriptionStatus.CANCELED,
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
      });

      await markEventProcessed({
        eventId: event.id,
        organizationId: row.organizationId,
        userId: row.userId,
      });

      return { processed: true };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getStripeCustomerId(invoice.customer);

      if (!customerId) {
        return { processed: false, reason: "missing_customer" };
      }

      const row = await prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (row) {
        await prisma.subscription.update({
          where: { id: row.id },
          data: { status: SubscriptionStatus.PAST_DUE },
        });

        await markEventProcessed({
          eventId: event.id,
          organizationId: row.organizationId,
          userId: row.userId,
          amountCents: invoice.amount_due ?? 0,
        });
      }

      return { processed: true };
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getStripeCustomerId(invoice.customer);

      if (!customerId) {
        return { processed: false, reason: "missing_customer" };
      }

      const row = await prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (row) {
        await markEventProcessed({
          eventId: event.id,
          organizationId: row.organizationId,
          userId: row.userId,
          amountCents: invoice.amount_paid ?? 0,
        });
      }

      return { processed: true };
    }

    default:
      return { processed: false, reason: "ignored" };
  }
}
