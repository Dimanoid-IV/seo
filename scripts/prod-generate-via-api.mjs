/**
 * Triggers ONE real article generation through the DEPLOYED production app,
 * which has Hermes configured at runtime. Mints a short-lived access token
 * with the local JWT_ACCESS_SECRET (never printed) and calls the authenticated
 * autopilot generate endpoint. Does NOT publish to WordPress.
 */
import { readFileSync } from "node:fs";
import { SignJWT } from "jose";

const APP_URL = "https://www.rankboost.eu";
const userId = "61e2d0aa-1c3d-48d0-8520-900dca3aef4e";
const organizationId = "e418a366-67bb-4e05-b27c-c80226b5f48f";
const planId = "35b352b4-6a7f-479f-a27c-f458a30c18c8";
const itemId = process.argv[2] || "plan-item-action-3";

function readEnvFileVar(key) {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = text.match(new RegExp(`^${key}=(.*)$`, "m"));
  return m ? m[1].replace(/^"|"$/g, "").trim() : null;
}

async function resolveToken() {
  // 1) Explicit production access token (preferred; short-lived, never logged).
  if (process.env.RB_ACCESS_TOKEN?.trim()) {
    return process.env.RB_ACCESS_TOKEN.trim();
  }
  // 2) Mint from an explicit production JWT secret provided via env.
  const secretValue =
    process.env.RB_JWT_SECRET?.trim() || readEnvFileVar("JWT_ACCESS_SECRET");
  if (!secretValue) throw new Error("No token/secret available");
  const secret = new TextEncoder().encode(secretValue);
  return new SignJWT({ userId, organizationId, role: "user", locale: "ru" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

const token = await resolveToken();

const url = `${APP_URL}/api/autopilot/monthly/${planId}/generate-article-draft`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ itemId }),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = { raw: text.slice(0, 500) };
}

const article = json?.data?.article;
const quality = json?.data?.qualityReport;
const planItem = json?.data?.planItem;

console.log(
  JSON.stringify(
    {
      httpStatus: res.status,
      ok: res.ok,
      articleId: article?.id,
      title: article?.title,
      status: article?.status,
      slug: article?.slug,
      language: article?.language,
      metaTitle: article?.metaTitle,
      metaDescription: article?.metaDescription,
      wordCount: article?.contentHtml
        ? article.contentHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
        : undefined,
      qualityScore: quality?.score,
      qualityPassed: quality?.passed,
      planItemStatus: planItem?.status,
      generatedArticleId: planItem?.generatedArticleId,
      reviewQueueHref: planItem?.reviewQueueHref,
      error: json?.error,
    },
    null,
    2
  )
);
