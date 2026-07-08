import { SubscriptionPlan } from "@prisma/client";

export type BillingPlanKey = "FREE" | "STARTER" | "PRO" | "AGENCY";

export type BillingFeatureKey =
  | "gsc"
  | "wordpress"
  | "controlCenter"
  | "emailSend"
  | "advancedReports"
  | "agencyMode";

export type BillingPlanConfig = {
  label: string;
  websites: number;
  monthlyAudits: number;
  monthlyAiGenerations: number;
  monthlyArticles: number;
  monthlySocialPosts: number;
  monthlyAutopilotPlans: number;
  emailApprovals: number;
  reports: number;
  features: Record<BillingFeatureKey, boolean>;
};

export const BILLING_PLANS: Record<BillingPlanKey, BillingPlanConfig> = {
  FREE: {
    label: "Free",
    websites: 1,
    monthlyAudits: 3,
    monthlyAiGenerations: 5,
    monthlyArticles: 1,
    monthlySocialPosts: 3,
    monthlyAutopilotPlans: 1,
    emailApprovals: 1,
    reports: 1,
    features: {
      gsc: true,
      wordpress: false,
      controlCenter: true,
      emailSend: false,
      advancedReports: false,
      agencyMode: false,
    },
  },
  STARTER: {
    label: "Starter",
    websites: 1,
    monthlyAudits: 20,
    monthlyAiGenerations: 30,
    monthlyArticles: 5,
    monthlySocialPosts: 20,
    monthlyAutopilotPlans: 3,
    emailApprovals: 10,
    reports: 5,
    features: {
      gsc: true,
      wordpress: true,
      controlCenter: true,
      emailSend: true,
      advancedReports: false,
      agencyMode: false,
    },
  },
  PRO: {
    label: "Pro",
    websites: 5,
    monthlyAudits: 100,
    monthlyAiGenerations: 150,
    monthlyArticles: 25,
    monthlySocialPosts: 100,
    monthlyAutopilotPlans: 10,
    emailApprovals: 50,
    reports: 20,
    features: {
      gsc: true,
      wordpress: true,
      controlCenter: true,
      emailSend: true,
      advancedReports: true,
      agencyMode: false,
    },
  },
  AGENCY: {
    label: "Agency",
    websites: 20,
    monthlyAudits: 500,
    monthlyAiGenerations: 500,
    monthlyArticles: 100,
    monthlySocialPosts: 300,
    monthlyAutopilotPlans: 50,
    emailApprovals: 200,
    reports: 100,
    features: {
      gsc: true,
      wordpress: true,
      controlCenter: true,
      emailSend: true,
      advancedReports: true,
      agencyMode: true,
    },
  },
};

export const UPGRADEABLE_PLANS: BillingPlanKey[] = ["STARTER", "PRO", "AGENCY"];

export function normalizeBillingPlan(plan: SubscriptionPlan): BillingPlanKey {
  switch (plan) {
    case SubscriptionPlan.STARTER:
    case SubscriptionPlan.START:
    case SubscriptionPlan.AUDIT:
      return "STARTER";
    case SubscriptionPlan.PRO:
    case SubscriptionPlan.GROWTH:
      return "PRO";
    case SubscriptionPlan.AGENCY:
      return "AGENCY";
    case SubscriptionPlan.FREE:
    default:
      return "FREE";
  }
}

export function billingPlanToSubscriptionPlan(
  plan: BillingPlanKey
): SubscriptionPlan {
  switch (plan) {
    case "STARTER":
      return SubscriptionPlan.STARTER;
    case "PRO":
      return SubscriptionPlan.PRO;
    case "AGENCY":
      return SubscriptionPlan.AGENCY;
    case "FREE":
    default:
      return SubscriptionPlan.FREE;
  }
}

export function getStripePriceIdForPlan(plan: BillingPlanKey): string | null {
  const env = process.env;
  switch (plan) {
    case "STARTER":
      return env.STRIPE_STARTER_PRICE_ID?.trim() ?? null;
    case "PRO":
      return env.STRIPE_PRO_PRICE_ID?.trim() ?? null;
    case "AGENCY":
      return env.STRIPE_AGENCY_PRICE_ID?.trim() ?? null;
    default:
      return null;
  }
}

export function planFromStripePriceId(priceId: string): BillingPlanKey | null {
  const env = process.env;
  const normalizedPriceId = priceId.trim();
  if (normalizedPriceId === env.STRIPE_STARTER_PRICE_ID?.trim()) return "STARTER";
  if (normalizedPriceId === env.STRIPE_PRO_PRICE_ID?.trim()) return "PRO";
  if (normalizedPriceId === env.STRIPE_AGENCY_PRICE_ID?.trim()) return "AGENCY";
  return null;
}

export function planFromMetadata(
  plan: string | null | undefined
): BillingPlanKey | null {
  if (!plan) {
    return null;
  }

  const normalized = plan.trim().toUpperCase();
  if (
    normalized === "STARTER" ||
    normalized === "PRO" ||
    normalized === "AGENCY"
  ) {
    return normalized;
  }

  return null;
}

export function getPlanConfig(plan: SubscriptionPlan): BillingPlanConfig {
  return BILLING_PLANS[normalizeBillingPlan(plan)];
}
