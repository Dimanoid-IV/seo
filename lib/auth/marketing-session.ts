"use client";

import { getAccessToken } from "@/lib/auth/client-session";

export type MarketingSession = {
  authenticated: boolean;
  hasOrganization: boolean;
};

type MeResponse = {
  user?: { id?: string; email?: string } | null;
  organization?: { id?: string } | null;
};

function isLoggedInUser(user: MeResponse["user"]): boolean {
  return Boolean(user?.id || user?.email);
}

/**
 * Resolves auth for public marketing CTAs without silently refreshing tokens.
 * A visitor is authenticated only when /api/auth/me returns a real user.
 */
export async function fetchMarketingSession(): Promise<MarketingSession> {
  const token = getAccessToken();
  const headers: HeadersInit = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      headers,
    });

    if (!response.ok) {
      return { authenticated: false, hasOrganization: false };
    }

    const body = (await response.json()) as MeResponse;

    if (!isLoggedInUser(body.user)) {
      return { authenticated: false, hasOrganization: false };
    }

    return {
      authenticated: true,
      hasOrganization: Boolean(body.organization?.id),
    };
  } catch {
    return { authenticated: false, hasOrganization: false };
  }
}
