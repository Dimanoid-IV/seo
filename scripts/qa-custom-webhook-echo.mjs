/**
 * Safe custom-webhook E2E against RankBoost echo (Prompt 11.49).
 * Uses PRODUCTION Neon + public echo URL. Does NOT send article HTML.
 *
 * Usage:
 *   set -a && source .env.production-or-local && set +a
 *   # Prefer production DATABASE_URL
 *   node --import tsx scripts/qa-custom-webhook-echo.mjs
 */

import { pathToFileURL } from "node:url";
import path from "node:path";

const load = (rel) =>
  import(pathToFileURL(path.join(process.cwd(), rel)).href);

const ECHO_URL =
  process.env.RANKBOOST_ECHO_URL?.trim() ||
  "https://www.rankboost.eu/api/webhooks/rankboost-echo";

const websiteId =
  process.argv[2] || "ab7c514d-0e09-41fc-b0da-845479c6c382";
const articleId =
  process.argv[3] || "04aa451a-96bc-48d8-853c-09551f852c96";

const TEST_SECRET = "rb-qa-hmac-" + Date.now().toString(36);

const { getPrisma } = await load("lib/db.ts");
const { deliverCustomWebhook } = await load("lib/publishing/custom-webhook.ts");
const {
  getCustomPublishingConfig,
  disconnectCustomPublishingConfig,
} = await load("lib/publishing/custom-webhook-config.ts");
const { buildCustomPublishingDisplayState } = await load(
  "lib/publishing/custom-publishing-display.ts"
);
const { signWebhookPayload } = await load("lib/publishing/signature.ts");

const prisma = getPrisma();

console.log("=== Custom webhook echo QA ===");
console.log("echo_host=", new URL(ECHO_URL).host);
console.log("websiteId=", websiteId);
console.log("articleId=", articleId);

// 1) Direct echo ping
const pingBody = JSON.stringify({
  event: "rankboost.test",
  dryRun: true,
  article: { id: articleId, slug: "qa" },
});
const pingSig = signWebhookPayload(pingBody, TEST_SECRET);
const pingRes = await fetch(ECHO_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-RankBoost-Event": "rankboost.test",
    "X-RankBoost-Signature": pingSig,
  },
  body: pingBody,
});
const pingJson = await pingRes.json();
console.log("direct_echo_status=", pingRes.status);
console.log("direct_echo_ok=", pingJson.ok === true);
console.log("direct_echo_hasSignature=", pingJson.hasSignature === true);

if (!pingRes.ok || pingJson.ok !== true) {
  console.error("FAIL: echo endpoint not ready");
  process.exit(1);
}

// Reject full article content
const rejectRes = await fetch(ECHO_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    event: "article.ready",
    dryRun: false,
    article: { id: articleId, html: "<p>nope</p>" },
  }),
});
console.log("reject_html_status=", rejectRes.status);
if (rejectRes.status === 200) {
  console.error("FAIL: echo accepted article html");
  process.exit(1);
}

const website = await prisma.website.findFirst({
  where: { id: websiteId, deletedAt: null },
  select: { id: true, organizationId: true },
});
if (!website) {
  console.error("FAIL: website not found");
  process.exit(1);
}

const article = await prisma.article.findFirst({
  where: { id: articleId, websiteId, deletedAt: null },
  select: { id: true, title: true, qualityPassed: true, status: true },
});
console.log(
  "article_found=",
  Boolean(article),
  "qualityPassed=",
  article?.qualityPassed ?? null,
  "status=",
  article?.status ?? null
);

// 2) deliverCustomWebhook dry-run + persist
const result = await deliverCustomWebhook({
  articleId: article?.id ?? articleId,
  websiteId: website.id,
  organizationId: website.organizationId,
  endpointUrl: ECHO_URL,
  dryRun: true,
  sharedSecret: TEST_SECRET,
  persistOnSuccess: true,
});

console.log("deliver_dryRun=", result.dryRun);
console.log("deliver_delivered=", result.delivered);
console.log("deliver_statusCode=", result.statusCode);
if (result.error) console.log("deliver_error=", result.error);

if (!result.delivered) {
  console.error("FAIL: dry-run not delivered");
  process.exit(1);
}

const config = await getCustomPublishingConfig(website.id);
const display = buildCustomPublishingDisplayState({
  endpointConfigured: config?.endpointConfigured,
  endpointHost: config?.endpointHost,
  testedAt: config?.testedAt,
  hasSharedSecret: config?.hasSharedSecret,
});

console.log("config_host=", config?.endpointHost ?? null);
console.log("config_tested=", Boolean(config?.testedAt));
console.log("config_hasSecret=", config?.hasSharedSecret === true);
console.log("display_banner=", display.connectedBanner);
console.log(
  "display_no_secret_leak=",
  !JSON.stringify(display).includes(TEST_SECRET)
);

if (!display.connectedBanner?.startsWith("Подключено:")) {
  console.error("FAIL: expected connected banner");
  process.exit(1);
}

// 3) Optional cleanup unless KEEP_WEBHOOK=1
if (process.env.KEEP_WEBHOOK === "1") {
  console.log("KEEP_WEBHOOK=1 — leaving config in place");
} else {
  await disconnectCustomPublishingConfig(website.id);
  const after = await getCustomPublishingConfig(website.id);
  console.log(
    "disconnected=",
    !after?.testedAt && !after?.endpointConfigured
  );
}

await prisma.$disconnect();
console.log("=== custom webhook QA PASS ===");
