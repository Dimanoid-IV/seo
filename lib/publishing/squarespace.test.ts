import assert from "node:assert/strict";

import { testSquarespaceConnection } from "./squarespace";
import {
  normalizeSquarespaceUrl,
  parseSquarespaceScopes,
  SQUARESPACE_PUBLISHING_KIND,
} from "./squarespace-config";

const originalFetch = globalThis.fetch;

async function main() {
  assert.equal(
    normalizeSquarespaceUrl("example.squarespace.com/blog?x=1#top"),
    "https://example.squarespace.com/blog"
  );
  assert.equal(
    normalizeSquarespaceUrl("https://example.com/blog/"),
    "https://example.com/blog"
  );

  const scopes = parseSquarespaceScopes({
    kind: SQUARESPACE_PUBLISHING_KIND,
    siteUrl: "https://example.com",
    blogUrl: "https://example.com/blog",
    testedAt: "2026-08-10T00:00:00.000Z",
  });
  assert.equal(scopes?.siteUrl, "https://example.com");
  assert.equal(scopes?.blogUrl, "https://example.com/blog");

  const requested: string[] = [];
  globalThis.fetch = (async (url, init) => {
    requested.push(url.toString());
    assert.equal((init?.headers as Record<string, string>)["User-Agent"], "RankBoost-Squarespace/1.0");
    return new Response("<html>ok</html>", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }) as typeof fetch;

  const test = await testSquarespaceConnection({
    siteUrl: "https://example.com",
    blogUrl: "https://example.com/blog",
  });
  assert.equal(test.ok, true);
  assert.deepEqual(requested, [
    "https://example.com/",
    "https://example.com/blog",
  ]);
}

main()
  .then(() => console.log("squarespace.test.ts: ok"))
  .finally(() => {
    globalThis.fetch = originalFetch;
  });
