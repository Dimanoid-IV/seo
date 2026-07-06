/**
 * Maps API error codes to beta-friendly UI copy.
 * Internal codes stay in API responses; UI should not expose them raw.
 */

const TECHNICAL_PATTERN =
  /BILLING_REQUIRED|HERMES_UNAVAILABLE|PLAN_LIMIT|OAuth|VALIDATION_ERROR|INTERNAL_ERROR|gsc_connection|UNAUTHORIZED|FORBIDDEN|NOT_FOUND/i;

export function looksTechnicalErrorMessage(message: string): boolean {
  return TECHNICAL_PATTERN.test(message);
}

export function friendlyApiErrorMessage(
  code: string | undefined,
  rawMessage: string | undefined,
  fallback: string
): string {
  switch (code) {
    case "BILLING_REQUIRED":
      return "Checkout is not configured yet. Your current plan stays active.";
    case "HERMES_UNAVAILABLE":
      return "AI generation is not available yet. Please try again later.";
    case "PLAN_LIMIT_EXCEEDED":
      return "You've reached the limit for your current plan. View Billing to see your usage.";
    case "FEATURE_NOT_AVAILABLE":
      return (
        rawMessage?.trim() ||
        "This feature is not available on your current plan."
      );
    case "VALIDATION_ERROR":
      if (rawMessage?.trim() && !looksTechnicalErrorMessage(rawMessage)) {
        return rawMessage.trim();
      }
      return fallback;
    default:
      break;
  }

  const message = rawMessage?.trim();
  if (message && !looksTechnicalErrorMessage(message)) {
    return message;
  }

  return fallback;
}
