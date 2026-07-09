import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { getSaasDictionary } from "@/lib/i18n/saas";

export function friendlyApiErrorMessageForLocale(
  locale: SaasLocale,
  code: string | undefined,
  rawMessage: string | undefined,
  fallback: string,
  details?: { billingError?: string }
): string {
  const errors = getSaasDictionary(locale).errors;

  if (details?.billingError === "ONBOARDING_REQUIRED") {
    return errors.onboardingRequired;
  }

  switch (code) {
    case "BILLING_REQUIRED":
      return errors.billingRequired;
    case "HERMES_UNAVAILABLE":
      return errors.hermesUnavailable;
    case "PLAN_LIMIT_EXCEEDED":
      return errors.planLimitExceeded;
    case "FEATURE_NOT_AVAILABLE":
      return rawMessage?.trim() || errors.featureNotAvailable;
    case "VALIDATION_ERROR":
      if (rawMessage?.trim() && !looksTechnicalErrorMessage(rawMessage)) {
        return rawMessage.trim();
      }
      return fallback;
    case "UNAUTHORIZED":
      return errors.unauthorized;
    case "FORBIDDEN":
      return errors.forbidden;
    case "NOT_FOUND":
      if (details?.billingError === "ONBOARDING_REQUIRED") {
        return errors.onboardingRequired;
      }
      return errors.notFound;
    case "CONFIGURATION_MISSING":
      return errors.configurationMissing;
    case "INTERNAL_ERROR":
      return errors.checkoutFailed;
    default:
      break;
  }

  if (rawMessage?.includes("gsc_connection_failed")) {
    return errors.gscConnectionFailed;
  }

  const message = rawMessage?.trim();
  if (message && !looksTechnicalErrorMessage(message)) {
    return message;
  }

  return fallback;
}

const TECHNICAL_PATTERN =
  /BILLING_REQUIRED|HERMES_UNAVAILABLE|PLAN_LIMIT|OAuth|VALIDATION_ERROR|INTERNAL_ERROR|Internal server error|gsc_connection|UNAUTHORIZED|FORBIDDEN|NOT_FOUND|CONFIGURATION_MISSING/i;

export function looksTechnicalErrorMessage(message: string): boolean {
  return TECHNICAL_PATTERN.test(message);
}

export function friendlyApiErrorMessage(
  code: string | undefined,
  rawMessage: string | undefined,
  fallback: string,
  details?: { billingError?: string }
): string {
  return friendlyApiErrorMessageForLocale("en", code, rawMessage, fallback, details);
}
