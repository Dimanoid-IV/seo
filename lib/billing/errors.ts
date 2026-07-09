import { ErrorCode, AppError } from "@/lib/errors";

import { isStripeBillingConfigured } from "./stripe-env";
import type { BillingErrorCode } from "./types";

export function billingError(
  code: BillingErrorCode,
  message: string,
  plan: string
): AppError {
  const errorCode =
    code === "FEATURE_NOT_AVAILABLE"
      ? ErrorCode.FEATURE_NOT_AVAILABLE
      : code === "BILLING_NOT_CONFIGURED"
        ? ErrorCode.BILLING_NOT_CONFIGURED
        : code === "BILLING_REQUIRED"
          ? ErrorCode.BILLING_REQUIRED
          : ErrorCode.PLAN_LIMIT_EXCEEDED;

  return new AppError(errorCode, message, {
    details: {
      billingError: code,
      plan,
      upgradeUrl: "/app/billing",
    },
  });
}

export function isStripeConfigured(): boolean {
  return isStripeBillingConfigured();
}
