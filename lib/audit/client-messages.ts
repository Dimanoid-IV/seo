import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { getSaasDictionary } from "@/lib/i18n/saas";

import type { ScoreLabel } from "./preview-response";

export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: {
      scannerError?: string;
    };
  };
};

/** Maps preview API errors to user-friendly localized messages. */
export function getAuditPreviewErrorMessage(
  status: number,
  body: ApiErrorPayload,
  locale: SaasLocale = "en"
): string {
  const errors = getSaasDictionary(locale).publicAudit.errors;
  const code = body.error?.code;
  const scannerError = body.error?.details?.scannerError;
  const serverMessage = body.error?.message;

  if (scannerError === "INVALID_URL") {
    return errors.invalidUrl;
  }
  if (scannerError === "SSRF_BLOCKED" || scannerError === "BLOCKED_HOST") {
    return errors.blockedHost;
  }
  if (scannerError === "TIMEOUT" || status === 408) {
    return errors.timeout;
  }
  if (scannerError === "TOO_LARGE" || status === 413) {
    return errors.tooLarge;
  }
  if (scannerError === "UNSUPPORTED_CONTENT_TYPE" || status === 415) {
    return errors.unsupportedContent;
  }
  if (
    scannerError === "WEBSITE_UNREACHABLE" ||
    scannerError === "DNS_FAILURE" ||
    scannerError === "SSL_FAILURE" ||
    status === 422
  ) {
    return errors.unreachable;
  }
  if (code === "VALIDATION_ERROR" && serverMessage) {
    return serverMessage;
  }
  if (status >= 500) {
    return errors.serverError;
  }

  return serverMessage ?? errors.generic;
}

export function formatFixMinutes(minutes: number, locale: SaasLocale = "en"): string {
  if (locale === "ru") {
    if (minutes < 60) {
      return `~${minutes} мин`;
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (rest === 0) {
      return `~${hours} ч`;
    }
    return `~${hours} ч ${rest} мин`;
  }

  if (locale === "et") {
    if (minutes < 60) {
      return `~${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (rest === 0) {
      return `~${hours} h`;
    }
    return `~${hours} h ${rest} min`;
  }

  if (minutes < 60) {
    return `~${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) {
    return `~${hours} h`;
  }
  return `~${hours} h ${rest} min`;
}

export function getAuditScoreLabel(label: ScoreLabel, locale: SaasLocale): string {
  return getSaasDictionary(locale).publicAudit.scoreLabels[label];
}
