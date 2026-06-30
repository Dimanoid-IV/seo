import { NextResponse } from "next/server";
import { z } from "zod";

import {
  AppError,
  ErrorCode,
  createErrorResponse,
  getRequestId,
} from "@/lib/errors";

import {
  clearRefreshTokenCookieOnResponse,
  setRefreshTokenCookieOnResponse,
} from "./cookies";

export function validationErrorFromZod(error: z.ZodError): AppError {
  const firstMessage =
    error.issues[0]?.message ?? "Ошибка валидации входных данных";

  return new AppError(ErrorCode.VALIDATION_ERROR, firstMessage, {
    details: { issues: error.issues },
  });
}

export function getRequestIdFromRequest(request: Request): string {
  return getRequestId(request.headers.get("x-request-id"));
}

export function authErrorResponse(request: Request, error: unknown): NextResponse {
  const { status, body, headers } = createErrorResponse(
    error,
    getRequestIdFromRequest(request)
  );
  return NextResponse.json(body, { status, headers });
}

type JsonOkOptions = {
  status?: number;
  refreshToken?: string;
};

export function authJsonResponse<T>(
  data: T,
  options?: JsonOkOptions
): NextResponse {
  const response = NextResponse.json(data, { status: options?.status ?? 200 });

  if (options?.refreshToken) {
    setRefreshTokenCookieOnResponse(response, options.refreshToken);
  }

  return response;
}

export function authNoContentResponse(): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return clearRefreshTokenCookieOnResponse(response);
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Некорректный JSON в теле запроса");
  }
}
