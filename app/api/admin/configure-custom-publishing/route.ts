import { authJsonResponse } from "@/lib/auth/responses";
import { getPrisma } from "@/lib/db";
import { assertSafeUrl } from "@/lib/audit/ssrf";
import { signWebhookPayload } from "@/lib/publishing/signature";
import { upsertCustomPublishingConfig } from "@/lib/publishing/custom-webhook-config";
import { shouldEnableCustomWebhookAutoSendFailClosed } from "@/lib/publishing/custom-webhook-autosend";

export const runtime = "nodejs";

function normalizeDomain(value: string): string {
  const raw = value.trim().toLowerCase();
  if (!raw) return "";
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname
      .replace(/^www\./, "")
      .replace(/\.$/, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function unauthorized() {
  return authJsonResponse({ error: "unauthorized" }, { status: 401 });
}

/**
 * One-shot production ops helper for connecting a custom publishing endpoint.
 * It is inert unless CUSTOM_PUBLISHING_SETUP_TOKEN and
 * CUSTOM_PUBLISHING_SETUP_SECRET are present in the deployment environment.
 * Never returns the endpoint URL or secret.
 */
export async function POST(request: Request) {
  const token = process.env.CUSTOM_PUBLISHING_SETUP_TOKEN?.trim();
  const secret = process.env.CUSTOM_PUBLISHING_SETUP_SECRET?.trim();
  if (!token || !secret) {
    return authJsonResponse({ error: "setup_not_configured" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return unauthorized();
  }

  const domain = normalizeDomain(
    process.env.CUSTOM_PUBLISHING_SETUP_DOMAIN?.trim() || "popart.ee"
  );
  const endpoint = new URL(
    process.env.CUSTOM_PUBLISHING_SETUP_ENDPOINT?.trim() ||
      "https://www.popart.ee/api/rankboost/articles"
  );
  if (endpoint.protocol !== "https:") {
    return authJsonResponse({ error: "endpoint_must_use_https" }, { status: 400 });
  }
  await assertSafeUrl(endpoint);

  const prisma = getPrisma();
  const websites = await prisma.website.findMany({
    where: { deletedAt: null, organization: { deletedAt: null } },
    select: {
      id: true,
      url: true,
      organizationId: true,
      organization: { select: { ownerUserId: true } },
    },
  });
  const matches = websites.filter(
    (website) => normalizeDomain(website.url) === domain
  );
  if (matches.length !== 1) {
    return authJsonResponse(
      { error: "website_match_failed", matchCount: matches.length, domain },
      { status: 404 }
    );
  }

  const website = matches[0];
  const body = JSON.stringify({
    event: "rankboost.test",
    dryRun: true,
    website: { id: website.id },
  });
  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "RankBoost-Webhook/1.0",
      "X-RankBoost-Event": "rankboost.test",
      "X-RankBoost-Signature": signWebhookPayload(body, secret),
    },
    body,
    signal: AbortSignal.timeout(10_000),
    redirect: "manual",
  });

  if (!response.ok) {
    return authJsonResponse(
      { error: "endpoint_test_failed", statusCode: response.status },
      { status: 502 }
    );
  }

  const autoSendEnabled = await shouldEnableCustomWebhookAutoSendFailClosed({
    userId: website.organization.ownerUserId,
    organizationId: website.organizationId,
    websiteId: website.id,
  });

  const config = await upsertCustomPublishingConfig({
    websiteId: website.id,
    organizationId: website.organizationId,
    endpointUrl: endpoint.toString(),
    tested: true,
    autoSendEnabled,
    sharedSecret: secret,
  });

  return authJsonResponse({
    data: {
      configured: true,
      domain,
      endpointHost: endpoint.host,
      websiteId: website.id,
      organizationId: website.organizationId,
      endpointTestStatus: response.status,
      endpointConfigured: config.endpointConfigured,
      tested: Boolean(config.testedAt),
      autoSendEnabled: config.autoSendEnabled,
      hasSharedSecret: config.hasSharedSecret,
    },
  });
}
