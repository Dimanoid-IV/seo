import "server-only";

import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";

import { findPrimaryOrganization, monthPeriod, resolveOwnedOrganization } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import {
  billingPlanToSubscriptionPlan,
  getPlanConfig,
  normalizeBillingPlan,
} from "./plans";
import { syncPlanLimitsFromConfig } from "./usage";

export async function ensureSubscription(input: {
  userId: string;
  organizationId: string;
}) {
  const prisma = getPrisma();
  const { start, end } = monthPeriod();

  let subscription = await prisma.subscription.findFirst({
    where: {
      organizationId: input.organizationId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: start,
        currentPeriodEnd: end,
      },
    });
  }

  await syncPlanLimitsFromConfig({
    organizationId: input.organizationId,
    subscriptionId: subscription.id,
    planKey: normalizeBillingPlan(subscription.plan),
  });

  return subscription;
}

export async function getCurrentSubscription(input: {
  userId: string;
  organizationId?: string | null;
}) {
  const prisma = getPrisma();

  let organizationId = input.organizationId;
  if (organizationId) {
    const org = await resolveOwnedOrganization(
      prisma,
      input.userId,
      organizationId
    );
    organizationId = org?.id ?? null;
  } else {
    const org = await findPrimaryOrganization(prisma, input.userId);
    organizationId = org?.id ?? null;
  }

  if (!organizationId) {
    throw new AppError(ErrorCode.NOT_FOUND, "Organization not found", {
      details: { billingError: "ONBOARDING_REQUIRED" },
    });
  }

  const subscription = await ensureSubscription({
    userId: input.userId,
    organizationId,
  });

  const planLimit = await prisma.planLimit.findFirst({
    where: {
      subscriptionId: subscription.id,
      organizationId,
    },
    orderBy: { periodStart: "desc" },
  });

  return {
    subscription,
    planLimit,
    organizationId,
    planKey: normalizeBillingPlan(subscription.plan),
    planConfig: getPlanConfig(subscription.plan),
  };
}

export async function resolveOrganizationForBilling(
  userId: string,
  organizationIdHint?: string | null
) {
  const prisma = getPrisma();
  return resolveOwnedOrganization(prisma, userId, organizationIdHint);
}

export function isPaidSubscriptionActive(
  status: SubscriptionStatus,
  plan: SubscriptionPlan
): boolean {
  if (plan === SubscriptionPlan.FREE) {
    return true;
  }

  return (
    status === SubscriptionStatus.ACTIVE ||
    status === SubscriptionStatus.TRIALING ||
    status === SubscriptionStatus.PAST_DUE
  );
}

export async function updateSubscriptionPlan(input: {
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: Date | null;
}) {
  const prisma = getPrisma();

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: input.organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return null;
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: input.plan,
      status: input.status,
      stripeCustomerId: input.stripeCustomerId ?? undefined,
      stripeSubscriptionId: input.stripeSubscriptionId ?? undefined,
      stripePriceId: input.stripePriceId ?? undefined,
      currentPeriodStart: input.currentPeriodStart ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? undefined,
      trialEndsAt: input.trialEndsAt ?? undefined,
    },
  });

  await syncPlanLimitsFromConfig({
    organizationId: input.organizationId,
    subscriptionId: updated.id,
    planKey: normalizeBillingPlan(updated.plan),
  });

  return updated;
}

export { billingPlanToSubscriptionPlan };
