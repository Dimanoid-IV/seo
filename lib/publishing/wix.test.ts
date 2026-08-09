import assert from "node:assert/strict";

import { testWixConnection } from "./wix";
import {
  isSafeWixSiteId,
  normalizeWixSiteId,
  parseWixScopes,
  WIX_PUBLISHING_KIND,
} from "./wix-config";

const originalFetch = globalThis.fetch;

async function main() {
  assert.equal(normalizeWixSiteId("  site_123456  "), "site_123456");
  assert.equal(isSafeWixSiteId("site_123456"), true);
  assert.equal(isSafeWixSiteId("bad site id"), false);

  const scopes = parseWixScopes({
    kind: WIX_PUBLISHING_KIND,
    siteId: "site_123456",
    testedAt: "2026-08-10T00:00:00.000Z",
  });
  assert.equal(scopes?.siteId, "site_123456");

  globalThis.fetch = (async (url, init) => {
    assert.equal(
      url.toString(),
      "https://www.wixapis.com/blog/v3/draft-posts?paging.limit=1"
    );
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer wix_test_key");
    assert.equal(headers["wix-site-id"], "site_123456");
    assert.equal(headers["User-Agent"], "RankBoost-Wix/1.0");
    return new Response(JSON.stringify({ draftPosts: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const test = await testWixConnection({
    siteId: "site_123456",
    apiKey: "wix_test_key",
  });
  assert.equal(test.ok, true);
  assert.equal(test.siteId, "site_123456");
}

main()
  .then(() => console.log("wix.test.ts: ok"))
  .finally(() => {
    globalThis.fetch = originalFetch;
  });
