import "server-only";

import {
  PaymentStatus,
  PaymentType,
  SubscriptionStatus,
  type SubscriptionPlan,
} from "@prisma/client";
import type Stripe from "stripe";

import { getPrisma } from "@/lib/db";

import {
  billingPlanToSubscriptionPlan,
  updateSubscriptionPlan,
} from "./get-subscription";
import { planFromStripePriceId } from "./plans";
import { timelineAfterSubscriptionUpdated } from "./hooks";

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

async function applyStripeSubscription(input: {
  organizationId: string;
  userId?: string | null;
  stripeSubscription: Stripe.Subscription;
  eventId: string;
}) {
  const subscriptionItem = input.stripeSubscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const planKey = priceId ? planFromStripePriceId(priceId) : null;
  const plan: SubscriptionPlan = planKey
    ? billingPlanToSubscriptionPlan(planKey)
    : billingPlanToSubscriptionPlan("STARTER");

  const currentPeriodStart = subscriptionItem?.current_period_start
    ? new Date(subscriptionItem.current_period_start * 1000)
    : null;
  const currentPeriodEnd = subscriptionItem?.current_period_end
    ? new Date(subscriptionItem.current_period_end * 1000)
    : null;

  await updateSubscriptionPlan({
    organizationId: input.organizationId,
    plan,
    status: mapStripeStatus(input.stripeSubscription.status),
    stripeCustomerId:
      typeof input.stripeSubscription.customer === "string"
        ? input.stripeSubscription.customer
        : input.stripeSubscription.customer.id,
    stripeSubscriptionId: input.stripeSubscription.id,
    stripePriceId: priceId ?? null,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: input.stripeSubscription.cancel_at_period_end,
  });

  if (input.userId) {
    try {
      await timelineAfterSubscriptionUpdated({
        userId: input.userId,
        websiteId: null,
        organizationId: input.organizationId,
        plan: planKey ?? "STARTER",
      });
    } catch {
      // Timeline must not block webhook processing.
    }
  }

  await markEventProcessed({
    eventId: input.eventId,
    organizationId: input.organizationId,
    userId: input.userId,
  });
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  if (await isEventProcessed(event.id)) {
    return { processed: false, reason: "duplicate" };
  }

  const prisma = getPrisma();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      const userId = session.metadata?.userId;

      if (!organizationId) {
        return { processed: false, reason: "missing_organization" };
      }

      if (session.subscription && typeof session.subscription === "string") {
        const stripe = (await import("./stripe")).requireStripeClient();
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        );
        await applyStripeSubscription({
          organizationId,
          userId,
          stripeSubscription: subscription,
          eventId: event.id,
        });
      } else {
        await markEventProcessed({
          eventId: event.id,
          organizationId,
          userId,
        });
      }

      return { processed: true };
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId =
        subscription.metadata?.organizationId ??
        (await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          select: { organizationId: true, userId: true },
        }))?.organizationId;

      if (!organizationId) {
        return { processed: false, reason: "missing_organization" };
      }

      const subRow = await prisma.subscription.findFirst({
        where: { organizationId },
        select: { userId: true },
      });

      await applyStripeSubscription({
        organizationId,
        userId: subRow?.userId,
        stripeSubscription: subscription,
        eventId: event.id,
      });

      return { processed: true };
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
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

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
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

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
