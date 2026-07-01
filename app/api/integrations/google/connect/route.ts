import { NextResponse } from "next/server";

import { requireUserFromSession } from "@/lib/auth/session-user";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  buildGoogleOAuthUrl,
  createGoogleOAuthState,
} from "@/lib/google/oauth";
import { resolveWebsiteForOAuth } from "@/lib/integrations/gsc-connect";

const INTEGRATIONS_PATH = "/app/integrations";

function redirectToIntegrations(
  params: Record<string, string>
): NextResponse {
  const url = new URL(INTEGRATIONS_PATH, getAppOrigin());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

function getAppOrigin(): string {
  const env = getServerEnv();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }

  if (env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://rankboost.eu";
}

function redirectToLogin(): NextResponse {
  const loginUrl = new URL("/login", getAppOrigin());
  loginUrl.searchParams.set("next", INTEGRATIONS_PATH);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  try {
    if (!getServerEnv().DATABASE_URL) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "База данных не настроена. Установите DATABASE_URL.",
        { statusCode: 503 }
      );
    }

    const currentUser = await requireUserFromSession(request);
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    const { website, organizationId } = await resolveWebsiteForOAuth(
      currentUser,
      websiteId
    );

    const state = await createGoogleOAuthState({
      userId: currentUser.id,
      websiteId: website.id,
      organizationId,
      provider: "google_search_console",
    });

    const googleUrl = buildGoogleOAuthUrl(state);

    return NextResponse.redirect(googleUrl);
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCode.UNAUTHORIZED) {
      return redirectToLogin();
    }

    return redirectToIntegrations({ error: "gsc_connection_failed" });
  }
}
