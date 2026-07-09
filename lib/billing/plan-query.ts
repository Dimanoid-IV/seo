import type { BillingPlanKey } from "./plans";

const PAID_PLAN_QUERY_VALUES = new Set(["starter", "pro", "agency"]);

export function billingPlanQueryValue(plan: BillingPlanKey): string {
  return plan.toLowerCase();
}

export function normalizeBillingPlanQuery(
  value: string | null | undefined
): string | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || !PAID_PLAN_QUERY_VALUES.has(normalized)) {
    return null;
  }
  return normalized;
}

export function planQuerySuffix(plan: string | null | undefined): string {
  const normalized = normalizeBillingPlanQuery(plan);
  return normalized ? `?plan=${normalized}` : "";
}

export function registerPathForPlan(plan: BillingPlanKey): string {
  return `/register?plan=${billingPlanQueryValue(plan)}`;
}

export function loginPathForPlan(plan: BillingPlanKey): string {
  return `/login?plan=${billingPlanQueryValue(plan)}`;
}

export function onboardingPathForPlan(plan: BillingPlanKey): string {
  return `/app/onboarding?plan=${billingPlanQueryValue(plan)}`;
}

export function billingPathForPlan(plan: BillingPlanKey): string {
  return `/app/billing?plan=${billingPlanQueryValue(plan)}`;
}

export function billingPathForPlanQuery(plan: string | null | undefined): string {
  const normalized = normalizeBillingPlanQuery(plan);
  return normalized ? `/app/billing?plan=${normalized}` : "/app/billing";
}
