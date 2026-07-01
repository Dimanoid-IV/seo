import "server-only";

import type { BillingPlanKey } from "./plans";
import {
  BILLING_PLANS,
  UPGRADEABLE_PLANS,
  normalizeBillingPlan,
} from "./plans";
import { isStripeConfigured } from "./errors";
import type {
  BillingOverviewResponse,
  BillingPlanViewModel,
  BillingSubscriptionViewModel,
} from "./types";
import { getCurrentSubscription } from "./get-subscription";
import { getUsageSummary } from "./usage";

export function formatBillingSubscription(input: {
  id: string;
  plan: string;
  planLabel: string;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: Date | null;
  features: BillingSubscriptionViewModel["features"];
}): BillingSubscriptionViewModel {
  return {
    id: input.id,
    plan: input.plan,
    planLabel: input.planLabel,
    status: input.status,
    currentPeriodStart: input.currentPeriodStart?.toISOString(),
    currentPeriodEnd: input.currentPeriodEnd?.toISOString(),
    cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    trialEndsAt: input.trialEndsAt?.toISOString(),
    stripeConfigured: isStripeConfigured(),
    features: input.features,
  };
}

export function formatBillingPlans(
  currentPlanKey: BillingPlanKey
): BillingPlanViewModel[] {
  return UPGRADEABLE_PLANS.concat(["FREE"]).map((key) => {
    const config = BILLING_PLANS[key];
    return {
      key: key.toLowerCase(),
      label: config.label,
      websites: config.websites,
      monthlyAudits: config.monthlyAudits,
      monthlyAiGenerations: config.monthlyAiGenerations,
      monthlyArticles: config.monthlyArticles,
      monthlySocialPosts: config.monthlySocialPosts,
      monthlyAutopilotPlans: config.monthlyAutopilotPlans,
      emailApprovals: config.emailApprovals,
      reports: config.reports,
      features: config.features,
      upgradeable: key !== "FREE",
      priceLabel: key === "FREE" ? "Free" : "Configured in Stripe",
      isCurrent: key === currentPlanKey,
    };
  });
}

export async function getBillingOverview(input: {
  userId: string;
  organizationId: string;
}): Promise<BillingOverviewResponse> {
  const current = await getCurrentSubscription(input);
  const usage = await getUsageSummary(input);

  return {
    subscription: formatBillingSubscription({
      id: current.subscription.id,
      plan: current.planKey.toLowerCase(),
      planLabel: current.planConfig.label,
      status: current.subscription.status.toLowerCase(),
      currentPeriodStart: current.subscription.currentPeriodStart,
      currentPeriodEnd: current.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: current.subscription.cancelAtPeriodEnd,
      trialEndsAt: current.subscription.trialEndsAt,
      features: current.planConfig.features,
    }),
    usage,
    plans: formatBillingPlans(current.planKey),
  };
}

export { normalizeBillingPlan };
