import { NextResponse } from "next/server";

import { requireUserFromSession } from "@/lib/auth/session-user";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  exchangeCodeForTokens,
  getGoogleUser,
  verifyGoogleOAuthState,
} from "@/lib/google/oauth";
import { connectGscIntegration } from "@/lib/integrations/gsc-connect";

const INTEGRATIONS_PATH = "/app/integrations";

function getAppOrigin(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }

  if (getServerEnv().NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://www.rankboost.eu";
}

function redirectToIntegrations(
  params: Record<string, string>
): NextResponse {
  const url = new URL(INTEGRATIONS_PATH, getAppOrigin());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return redirectToIntegrations({ error: "gsc_connection_failed" });
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return redirectToIntegrations({ error: "gsc_connection_failed" });
  }

  try {
    if (!getServerEnv().DATABASE_URL) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "База данных не настроена. Установите DATABASE_URL.",
        { statusCode: 503 }
      );
    }

    const currentUser = await requireUserFromSession(request);
    const oauthState = await verifyGoogleOAuthState(state);

    if (oauthState.userId !== currentUser.id) {
      throw new AppError(ErrorCode.FORBIDDEN, "OAuth state не совпадает с сессией");
    }

    const tokens = await exchangeCodeForTokens(code);
    const googleUser = await getGoogleUser(tokens.access_token);

    await connectGscIntegration({
      currentUser,
      websiteId: oauthState.websiteId,
      organizationId: oauthState.organizationId,
      tokens,
      googleUser,
    });

    return redirectToIntegrations({ connected: "gsc" });
  } catch {
    return redirectToIntegrations({ error: "gsc_connection_failed" });
  }
}
