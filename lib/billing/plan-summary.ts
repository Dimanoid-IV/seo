import "server-only";

import { getCurrentSubscription } from "./get-subscription";
import type { BillingPlanKey } from "./plans";

export type SubscriptionPlanSummary = {
  id: string;
  plan: string;
  planKey: BillingPlanKey;
  planLabel: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
};

export async function getSubscriptionPlanSummary(input: {
  userId: string;
  organizationId: string;
}): Promise<SubscriptionPlanSummary> {
  const current = await getCurrentSubscription(input);

  return {
    id: current.subscription.id,
    plan: current.planKey.toLowerCase(),
    planKey: current.planKey,
    planLabel: current.planConfig.label,
    status: current.subscription.status.toLowerCase(),
    currentPeriodStart:
      current.subscription.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd:
      current.subscription.currentPeriodEnd?.toISOString() ?? null,
  };
}
