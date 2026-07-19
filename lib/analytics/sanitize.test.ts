/**
 * Run with: npx tsx lib/analytics/sanitize.test.ts
 */

import assert from "node:assert/strict";

import {
  assertNoSensitiveLeak,
  sanitizeProperties,
} from "./sanitize";

{
  const cleaned = sanitizeProperties({
    plan: "growth",
    locale: "ru",
    route: "/ru/pricing",
    status: "ok",
    step: "audit",
    count: 3,
    qualityScore: 82,
    articleId: "ab7c514d-0e09-41fc-b0da-845479c6c382",
    password: "secret-value",
    accessToken: "tok_abc",
    apiKey: "sk_live_xxx",
    email: "user@example.com",
    contentHtml: "<p>Article body</p>",
    webhookUrl: "https://evil.example/hook?token=abc",
    authorization: "Bearer abc.def.ghi",
  });

  assert.equal(cleaned.plan, "growth");
  assert.equal(cleaned.locale, "ru");
  assert.equal(cleaned.route, "/ru/pricing");
  assert.equal(cleaned.status, "ok");
  assert.equal(cleaned.step, "audit");
  assert.equal(cleaned.count, 3);
  assert.equal(cleaned.qualityScore, 82);
  assert.equal(cleaned.articleId, "ab7c514d-0e09-41fc-b0da-845479c6c382");
  assert.equal(cleaned.password, undefined);
  assert.equal(cleaned.accessToken, undefined);
  assert.equal(cleaned.apiKey, undefined);
  assert.equal(cleaned.email, undefined);
  assert.equal(cleaned.contentHtml, undefined);
  assert.equal(cleaned.webhookUrl, undefined);
  assert.equal(cleaned.authorization, undefined);
  assert.ok(assertNoSensitiveLeak(cleaned));
}

{
  // Public anonymous event props must not retain secrets/emails/tokens.
  const cleaned = sanitizeProperties({
    cta: "hero",
    email: "anon@rankboost.eu",
    token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def",
    secret: "whsec_abc123",
    password: "hunter2",
    url: "https://rankboost.eu/callback?code=secret123&state=x",
  });

  assert.equal(cleaned.cta, "hero");
  assert.equal(cleaned.email, undefined);
  assert.equal(cleaned.token, undefined);
  assert.equal(cleaned.secret, undefined);
  assert.equal(cleaned.password, undefined);
  // URL query tokens stripped to origin+path
  assert.equal(cleaned.url, "https://rankboost.eu/callback");
  const json = JSON.stringify(cleaned);
  assert.ok(!/@/.test(json) || !json.includes("anon@"));
  assert.ok(!/Bearer/i.test(json));
  assert.ok(!/whsec_/i.test(json));
  assert.ok(!/hunter2/.test(json));
  assert.ok(!/secret123/.test(json));
  assert.ok(assertNoSensitiveLeak(cleaned));
}

{
  assert.deepEqual(sanitizeProperties(null), {});
  assert.deepEqual(sanitizeProperties(undefined), {});
  assert.deepEqual(sanitizeProperties({}), {});
}

console.log("sanitize.test.ts: ok");
