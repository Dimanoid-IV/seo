import { ErrorCode, AppError } from "@/lib/errors";

import type { BillingErrorCode } from "./types";

export function billingError(
  code: BillingErrorCode,
  message: string,
  plan: string
): AppError {
  const errorCode =
    code === "FEATURE_NOT_AVAILABLE"
      ? ErrorCode.FEATURE_NOT_AVAILABLE
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
  const env = process.env;
  return Boolean(
    env.STRIPE_SECRET_KEY?.trim() &&
      env.STRIPE_STARTER_PRICE_ID?.trim() &&
      env.STRIPE_PRO_PRICE_ID?.trim() &&
      env.STRIPE_AGENCY_PRICE_ID?.trim()
  );
}
