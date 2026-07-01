import "server-only";

import type { UsageKey } from "@prisma/client";

import type { BillingFeatureKey } from "./plans";
import { billingError } from "./errors";
import { getCurrentSubscription } from "./get-subscription";
import { checkUsageLimit, incrementUsage } from "./usage";

export async function canUseFeature(input: {
  userId: string;
  organizationId: string;
  feature: BillingFeatureKey;
}): Promise<boolean> {
  const { planConfig } = await getCurrentSubscription({
    userId: input.userId,
    organizationId: input.organizationId,
  });

  return Boolean(planConfig.features[input.feature]);
}

export async function assertCanUseFeature(input: {
  userId: string;
  organizationId: string;
  feature: BillingFeatureKey;
  message?: string;
}) {
  const allowed = await canUseFeature(input);

  if (!allowed) {
    const { planKey } = await getCurrentSubscription({
      userId: input.userId,
      organizationId: input.organizationId,
    });

    throw billingError(
      "FEATURE_NOT_AVAILABLE",
      input.message ??
        "This feature is not available on your current plan. Upgrade to continue.",
      planKey
    );
  }
}

export async function assertUsageLimit(input: {
  userId: string;
  organizationId: string;
  websiteId?: string | null;
  key: UsageKey;
  message?: string;
}) {
  const result = await checkUsageLimit(input);

  if (!result.allowed) {
    throw billingError(
      "LIMIT_REACHED",
      input.message ??
        `You've reached the monthly limit for this action on your ${result.plan} plan. Upgrade to continue.`,
      result.plan
    );
  }

  return result;
}

export async function recordUsage(input: {
  userId: string;
  organizationId: string;
  websiteId?: string | null;
  key: UsageKey;
}) {
  await incrementUsage(input);
}
