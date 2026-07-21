#!/usr/bin/env node
/**
 * Safely connect a RankBoost custom publishing endpoint for a website.
 *
 * No secrets or full endpoint URLs are printed.
 *
 * Usage:
 *   vercel env run --environment production -- \
 *     node --import tsx scripts/configure-custom-publishing.mjs \
 *     --domain popart.ee \
 *     --endpoint https://www.popart.ee/api/rankboost/articles \
 *     --secret-file ~/.popart-rankboost-webhook-secret
 *
 * Or:
 *   RANKBOOST_CUSTOM_WEBHOOK_SECRET=... node --import tsx scripts/configure-custom-publishing.mjs ...
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const load = (rel) => import(pathToFileURL(path.join(process.cwd(), rel)).href);

function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function expandHome(filePath) {
  if (!filePath) return filePath;
  if (filePath === "~") return os.homedir();
  if (filePath.startsWith("~/")) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
}

function normalizeDomain(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname
      .replace(/^www\./, "")
      .replace(/\.$/, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function normalizeWebsiteDomain(url) {
  return normalizeDomain(url);
}

async function readSecret() {
  const envSecret = process.env.RANKBOOST_CUSTOM_WEBHOOK_SECRET?.trim();
  if (envSecret) return envSecret;

  const secretFile = expandHome(
    readArg("--secret-file", "~/.popart-rankboost-webhook-secret")
  );
  if (!secretFile || !fs.existsSync(secretFile)) {
    throw new Error(
      "Missing webhook secret. Set RANKBOOST_CUSTOM_WEBHOOK_SECRET or pass --secret-file."
    );
  }
  const secret = fs.readFileSync(secretFile, "utf8").trim();
  if (!secret) {
    throw new Error("Webhook secret file is empty.");
  }
  return secret;
}

const domain = normalizeDomain(readArg("--domain"));
const endpointUrl = readArg("--endpoint");
const forceAutoSend =
  hasFlag("--enable-auto-send") ? true : hasFlag("--disable-auto-send") ? false : null;

if (!domain || !endpointUrl) {
  console.error(
    "Usage: node --import tsx scripts/configure-custom-publishing.mjs --domain popart.ee --endpoint https://www.popart.ee/api/rankboost/articles [--secret-file ~/.secret]"
  );
  process.exit(2);
}

const endpoint = new URL(endpointUrl);
if (endpoint.protocol !== "https:" && process.env.NODE_ENV !== "development") {
  throw new Error("Endpoint must use HTTPS outside development.");
}

const secret = await readSecret();

const { getPrisma } = await load("lib/db.ts");
const { assertSafeUrl } = await load("lib/audit/ssrf.ts");
const { signWebhookPayload } = await load("lib/publishing/signature.ts");
const { upsertCustomPublishingConfig, getCustomPublishingConfig } = await load(
  "lib/publishing/custom-webhook-config.ts"
);
const { shouldEnableCustomWebhookAutoSendForCurrentPlan } = await load(
  "lib/publishing/custom-webhook-autosend.ts"
);

await assertSafeUrl(endpoint);

const prisma = getPrisma();
const websites = await prisma.website.findMany({
  where: {
    deletedAt: null,
    organization: { deletedAt: null },
  },
  select: {
    id: true,
    url: true,
    organizationId: true,
    organization: { select: { ownerUserId: true } },
  },
});

const matches = websites.filter(
  (website) => normalizeWebsiteDomain(website.url) === domain
);

if (matches.length === 0) {
  throw new Error(`No active RankBoost website found for domain ${domain}.`);
}
if (matches.length > 1) {
  throw new Error(`Multiple RankBoost websites found for domain ${domain}; pass a unique domain.`);
}

const website = matches[0];

const payload = JSON.stringify({
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
    "X-RankBoost-Signature": signWebhookPayload(payload, secret),
  },
  body: payload,
  signal: AbortSignal.timeout(10_000),
  redirect: "manual",
});

if (!response.ok) {
  throw new Error(`Endpoint test failed with HTTP ${response.status}.`);
}

let autoSendEnabled = false;
if (forceAutoSend !== null) {
  autoSendEnabled = forceAutoSend;
} else {
  autoSendEnabled = await shouldEnableCustomWebhookAutoSendForCurrentPlan({
    userId: website.organization.ownerUserId,
    organizationId: website.organizationId,
    websiteId: website.id,
  });
}

await upsertCustomPublishingConfig({
  websiteId: website.id,
  organizationId: website.organizationId,
  endpointUrl: endpoint.toString(),
  tested: true,
  autoSendEnabled,
  sharedSecret: secret,
});

const config = await getCustomPublishingConfig(website.id);

console.log(
  JSON.stringify(
    {
      configured: true,
      domain,
      endpointHost: endpoint.host,
      websiteId: website.id,
      organizationId: website.organizationId,
      endpointTestStatus: response.status,
      endpointConfigured: config?.endpointConfigured === true,
      tested: Boolean(config?.testedAt),
      autoSendEnabled: config?.autoSendEnabled === true,
      hasSharedSecret: config?.hasSharedSecret === true,
    },
    null,
    2
  )
);
