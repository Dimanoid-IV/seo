"use client";

/**
 * Client-side access token storage for MVP.
 *
 * TODO: Move access token to secure session strategy before production hardening.
 */

const ACCESS_TOKEN_STORAGE_KEY = "rb_access_token";

let memoryAccessToken: string | null = null;

let refreshInFlight: Promise<boolean> | null = null;

export function storeAccessToken(token: string): void {
  memoryAccessToken = token;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  }
}

export function getAccessToken(): string | null {
  if (memoryAccessToken) {
    return memoryAccessToken;
  }

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (stored) {
      memoryAccessToken = stored;
      return stored;
    }
  }

  return null;
}

export function clearAccessToken(): void {
  memoryAccessToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
}

import { friendlyApiErrorMessage } from "@/lib/copy/user-errors";

type ApiErrorBody = {
  error?: {
    message?: string;
    code?: string;
    details?: {
      billingError?: string;
      upgradeUrl?: string;
    };
  };
};

export async function parseApiErrorMessage(
  response: Response,
  fallback = "Something went wrong. Please try again."
): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    const code = body.error?.code;
    const rawMessage = body.error?.message;
    const message = friendlyApiErrorMessage(code, rawMessage, fallback);
    const upgradeUrl = body.error?.details?.upgradeUrl;

    if (
      upgradeUrl &&
      (code === "PLAN_LIMIT_EXCEEDED" ||
        code === "FEATURE_NOT_AVAILABLE" ||
        code === "BILLING_REQUIRED" ||
        body.error?.details?.billingError)
    ) {
      return `${message} Open Billing to learn more.`;
    }

    return message;
  } catch {
    return fallback;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as { accessToken?: string };
      if (!data.accessToken) {
        return false;
      }

      storeAccessToken(data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * fetch wrapper that attaches Bearer token and retries once after refresh on 401.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = getAccessToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
  };

  let response = await fetch(input, requestInit);

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    clearAccessToken();
    return response;
  }

  const retryHeaders = new Headers(init?.headers);
  const newToken = getAccessToken();
  if (newToken) {
    retryHeaders.set("Authorization", `Bearer ${newToken}`);
  }

  response = await fetch(input, {
    ...init,
    headers: retryHeaders,
    credentials: init?.credentials ?? "include",
  });

  if (response.status === 401) {
    clearAccessToken();
  }

  return response;
}
