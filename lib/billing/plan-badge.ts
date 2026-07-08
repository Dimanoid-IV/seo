import type { PlanBadgeVariant } from "@/components/dashboard/PlanBadge";

export function billingPlanToBadgeVariant(
  plan: string | undefined
): PlanBadgeVariant {
  const normalized = plan?.toLowerCase();

  if (
    normalized === "starter" ||
    normalized === "start" ||
    normalized === "audit"
  ) {
    return "start";
  }

  if (normalized === "growth") {
    return "growth";
  }

  if (normalized === "pro") {
    return "pro";
  }

  if (normalized === "agency") {
    return "partner";
  }

  return "demo";
}
