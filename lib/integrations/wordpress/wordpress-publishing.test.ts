/**
 * Run with: npx tsx lib/integrations/wordpress/wordpress-publishing.test.ts
 */

import assert from "node:assert/strict";

import { isBlockedHostname } from "../../audit/ssrf";
import { signWebhookPayload, verifyWebhookSignature } from "../../publishing/signature";
import { canCreateWordPressDraftForQuality } from "./draft-eligibility";
import {
  normalizeWordPressUrl,
  parseWordPressUrlOrThrow,
} from "./normalize-url";
import { mapArticleToWpRestDraftPayload } from "./rest-payload";

{
  assert.equal(
    normalizeWordPressUrl("https://Example.com/blog/?x=1#hash"),
    "https://example.com"
  );
  assert.equal(normalizeWordPressUrl("example.com"), "https://example.com");
  assert.equal(
    normalizeWordPressUrl("https://example.com/"),
    "https://example.com"
  );
}

{
  assert.throws(() => parseWordPressUrlOrThrow(""), /URL/);
  assert.ok(isBlockedHostname("localhost"));
  assert.ok(isBlockedHostname("127.0.0.1"));
  assert.ok(isBlockedHostname("192.168.1.10"));
  assert.equal(isBlockedHostname("example.com"), false);
}

{
  const payload = mapArticleToWpRestDraftPayload({
    title: "Hello",
    contentHtml: "<p>Body</p>",
    metaDescription: "excerpt",
    slug: "hello",
    categories: [3],
    author: 1,
  });
  assert.equal(payload.status, "draft");
  assert.equal(payload.title, "Hello");
  assert.equal(payload.content, "<p>Body</p>");
  assert.equal(payload.excerpt, "excerpt");
  assert.equal(payload.slug, "hello");
  assert.deepEqual(payload.categories, [3]);
  assert.equal(payload.author, 1);
  assert.notEqual(payload.status, "publish");
}

{
  assert.equal(
    canCreateWordPressDraftForQuality({
      qualityPassed: false,
      status: "DRAFT",
    }),
    false
  );
  assert.equal(
    canCreateWordPressDraftForQuality({
      qualityPassed: true,
      status: "WAITING_REVIEW",
    }),
    true
  );
  assert.equal(
    canCreateWordPressDraftForQuality({
      qualityPassed: false,
      status: "WAITING_REVIEW",
    }),
    false
  );
}

{
  const body = JSON.stringify({ event: "rankboost.test" });
  const secret = "test-secret";
  const sig = signWebhookPayload(body, secret);
  assert.ok(sig.startsWith("sha256="));
  assert.equal(verifyWebhookSignature(body, secret, sig), true);
  assert.equal(verifyWebhookSignature(body, secret, "sha256=deadbeef"), false);
}

{
  const live = mapArticleToWpRestDraftPayload({
    title: "x",
    contentHtml: "<p>y</p>",
  });
  assert.equal(live.status, "draft");
}

console.log("wordpress-publishing.test.ts: ok");
