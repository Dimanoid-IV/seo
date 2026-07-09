import { ErrorCode, AppError } from "@/lib/errors";

import { isStripeBillingConfigured } from "./stripe-env";
import type { BillingErrorCode } from "./types";

function errorCodeForBillingError(code: BillingErrorCode): ErrorCode {
  switch (code) {
    case "FEATURE_NOT_AVAILABLE":
      return ErrorCode.FEATURE_NOT_AVAILABLE;
    case "BILLING_NOT_CONFIGURED":
      return ErrorCode.BILLING_NOT_CONFIGURED;
    case "BILLING_REQUIRED":
      return ErrorCode.BILLING_REQUIRED;
    case "BILLING_STATE_LEGACY_OR_INVALID":
      return ErrorCode.BILLING_STATE_LEGACY_OR_INVALID;
    case "BILLING_PORTAL_UNAVAILABLE":
      return ErrorCode.BILLING_PORTAL_UNAVAILABLE;
    case "CHECKOUT_FAILED":
      return ErrorCode.CHECKOUT_FAILED;
    case "LIMIT_REACHED":
      return ErrorCode.PLAN_LIMIT_EXCEEDED;
    default:
      return ErrorCode.PLAN_LIMIT_EXCEEDED;
  }
}

export function billingError(
  code: BillingErrorCode,
  message: string,
  plan: string
): AppError {
  return new AppError(errorCodeForBillingError(code), message, {
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
