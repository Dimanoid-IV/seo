import { AppError, ErrorCode, type ErrorDetails } from "@/lib/errors";

import {
  AuditScannerErrorCode,
  type AuditScannerErrorCode as AuditScannerErrorCodeType,
} from "./types";

const APP_ERROR_CODE_BY_SCANNER: Record<
  AuditScannerErrorCodeType,
  ErrorCode
> = {
  [AuditScannerErrorCode.SSRF_BLOCKED]: ErrorCode.SSRF_BLOCKED,
  [AuditScannerErrorCode.BLOCKED_HOST]: ErrorCode.SSRF_BLOCKED,
  [AuditScannerErrorCode.INVALID_URL]: ErrorCode.VALIDATION_ERROR,
  [AuditScannerErrorCode.UNSUPPORTED_CONTENT_TYPE]: ErrorCode.VALIDATION_ERROR,
  [AuditScannerErrorCode.TOO_LARGE]: ErrorCode.VALIDATION_ERROR,
  [AuditScannerErrorCode.WEBSITE_UNREACHABLE]: ErrorCode.WEBSITE_UNREACHABLE,
  [AuditScannerErrorCode.TIMEOUT]: ErrorCode.WEBSITE_UNREACHABLE,
  [AuditScannerErrorCode.DNS_FAILURE]: ErrorCode.WEBSITE_UNREACHABLE,
  [AuditScannerErrorCode.SSL_FAILURE]: ErrorCode.WEBSITE_UNREACHABLE,
};

const DEFAULT_MESSAGES: Record<AuditScannerErrorCodeType, string> = {
  [AuditScannerErrorCode.WEBSITE_UNREACHABLE]: "Сайт недоступен",
  [AuditScannerErrorCode.TIMEOUT]: "Превышено время ожидания ответа сайта",
  [AuditScannerErrorCode.INVALID_URL]: "Некорректный URL",
  [AuditScannerErrorCode.BLOCKED_HOST]: "Хост заблокирован политикой безопасности",
  [AuditScannerErrorCode.UNSUPPORTED_CONTENT_TYPE]:
    "Страница не является HTML-документом",
  [AuditScannerErrorCode.TOO_LARGE]: "HTML-страница превышает допустимый размер",
  [AuditScannerErrorCode.SSRF_BLOCKED]: "URL заблокирован SSRF-защитой",
  [AuditScannerErrorCode.DNS_FAILURE]: "Не удалось разрешить DNS-имя хоста",
  [AuditScannerErrorCode.SSL_FAILURE]: "Ошибка SSL/TLS при подключении к сайту",
};

/**
 * Creates an {@link AppError} for audit scanner failures with a stable scanner code in `details`.
 */
export function createScannerError(
  scannerError: AuditScannerErrorCodeType,
  message?: string,
  details?: ErrorDetails
): AppError {
  return new AppError(
    APP_ERROR_CODE_BY_SCANNER[scannerError],
    message ?? DEFAULT_MESSAGES[scannerError],
    {
      details: {
        scannerError,
        ...details,
      },
    }
  );
}

/**
 * Returns true when a scanner error must not trigger protocol fallback (https → http).
 */
export function isNonRetryableScannerError(error: unknown): boolean {
  if (!(error instanceof AppError)) {
    return false;
  }

  const scannerError = error.details.scannerError as
    | AuditScannerErrorCodeType
    | undefined;

  if (!scannerError) {
    return false;
  }

  return (
    scannerError === AuditScannerErrorCode.SSRF_BLOCKED ||
    scannerError === AuditScannerErrorCode.BLOCKED_HOST ||
    scannerError === AuditScannerErrorCode.INVALID_URL ||
    scannerError === AuditScannerErrorCode.UNSUPPORTED_CONTENT_TYPE ||
    scannerError === AuditScannerErrorCode.TOO_LARGE
  );
}

/**
 * Classifies low-level fetch/network errors into scanner error codes.
 */
export function classifyNetworkError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (!(error instanceof Error)) {
    return createScannerError(AuditScannerErrorCode.WEBSITE_UNREACHABLE);
  }

  const code = (error as NodeJS.ErrnoException).code;
  const message = error.message.toLowerCase();

  if (error.name === "AbortError" || code === "ABORT_ERR") {
    return createScannerError(AuditScannerErrorCode.TIMEOUT, undefined, {
      cause: message,
    });
  }

  if (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    message.includes("getaddrinfo")
  ) {
    return createScannerError(AuditScannerErrorCode.DNS_FAILURE, undefined, {
      cause: code ?? message,
    });
  }

  if (
    code === "CERT_HAS_EXPIRED" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    message.includes("ssl") ||
    message.includes("tls") ||
    message.includes("certificate")
  ) {
    return createScannerError(AuditScannerErrorCode.SSL_FAILURE, undefined, {
      cause: code ?? message,
    });
  }

  if (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "EHOSTUNREACH" ||
    code === "ENETUNREACH" ||
    code === "ETIMEDOUT"
  ) {
    return createScannerError(AuditScannerErrorCode.WEBSITE_UNREACHABLE, undefined, {
      cause: code ?? message,
    });
  }

  return createScannerError(AuditScannerErrorCode.WEBSITE_UNREACHABLE, undefined, {
    cause: code ?? message,
  });
}
