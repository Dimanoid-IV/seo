import { nanoid } from "nanoid";

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  PLAN_LIMIT_EXCEEDED: "PLAN_LIMIT_EXCEEDED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  INTEGRATION_ERROR: "INTEGRATION_ERROR",
  HERMES_UNAVAILABLE: "HERMES_UNAVAILABLE",
  WEBSITE_UNREACHABLE: "WEBSITE_UNREACHABLE",
  SSRF_BLOCKED: "SSRF_BLOCKED",
  FEATURE_NOT_AVAILABLE: "FEATURE_NOT_AVAILABLE",
  BILLING_REQUIRED: "BILLING_REQUIRED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export type ErrorDetails = Record<string, unknown>;

export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    details: ErrorDetails;
    requestId: string;
  };
};

const DEFAULT_STATUS_BY_CODE: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.PAYMENT_FAILED]: 402,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.PLAN_LIMIT_EXCEEDED]: 403,
  [ErrorCode.FEATURE_NOT_AVAILABLE]: 403,
  [ErrorCode.BILLING_REQUIRED]: 402,
  [ErrorCode.INTEGRATION_ERROR]: 502,
  [ErrorCode.HERMES_UNAVAILABLE]: 503,
  [ErrorCode.WEBSITE_UNREACHABLE]: 502,
  [ErrorCode.SSRF_BLOCKED]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details: ErrorDetails;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      statusCode?: number;
      details?: ErrorDetails;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode ?? DEFAULT_STATUS_BY_CODE[code];
    this.details = options?.details ?? {};
  }
}

export function getRequestId(existing?: string | null): string {
  if (existing?.trim()) {
    return existing.trim();
  }
  return `req_${nanoid(12)}`;
}

export function createErrorBody(
  error: AppError,
  requestId?: string
): ApiErrorBody {
  const id = getRequestId(requestId);
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      requestId: id,
    },
  };
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.message.startsWith("Missing required environment variable:")) {
      return new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Server configuration is incomplete. Check DATABASE_URL and auth secrets in .env.local.",
        { statusCode: 503, cause: error }
      );
    }

    return new AppError(ErrorCode.INTERNAL_ERROR, "Internal server error", {
      cause: error,
    });
  }

  return new AppError(ErrorCode.INTERNAL_ERROR, "Internal server error");
}

/**
 * Builds a JSON error payload and HTTP metadata for API route handlers.
 * Format matches docs/API-Design.md.
 */
export function createErrorResponse(
  error: unknown,
  requestId?: string
): {
  status: number;
  body: ApiErrorBody;
  headers: Record<string, string>;
} {
  const appError = toAppError(error);
  const id = getRequestId(requestId);
  return {
    status: appError.statusCode,
    body: createErrorBody(appError, id),
    headers: {
      "X-Request-Id": id,
      "Content-Type": "application/json",
    },
  };
}
