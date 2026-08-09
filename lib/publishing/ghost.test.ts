import assert from "node:assert/strict";

import { testGhostConnection } from "./ghost";
import {
  GHOST_PUBLISHING_KIND,
  normalizeGhostAdminUrl,
  parseGhostAdminKey,
  parseGhostScopes,
} from "./ghost-config";

const originalFetch = globalThis.fetch;

async function main() {
  assert.equal(normalizeGhostAdminUrl("example.com/ghost/#/settings"), "https://example.com");
  assert.deepEqual(parseGhostAdminKey("a".repeat(24) + ":" + "b".repeat(64)), {
    id: "a".repeat(24),
    secret: "b".repeat(64),
  });
  assert.equal(parseGhostAdminKey("bad:key"), null);

  const scopes = parseGhostScopes({
    kind: GHOST_PUBLISHING_KIND,
    adminUrl: "https://example.com",
    authorSlug: "rankboost",
    testedAt: "2026-08-09T00:00:00.000Z",
  });
  assert.equal(scopes?.adminUrl, "https://example.com");
  assert.equal(scopes?.authorSlug, "rankboost");

  globalThis.fetch = (async (url, init) => {
    assert.equal(url.toString(), "https://example.com/ghost/api/admin/site/");
    const auth = (init?.headers as Record<string, string>).Authorization;
    assert.match(auth, /^Ghost /);
    assert.equal((init?.headers as Record<string, string>)["User-Agent"], "RankBoost-Ghost/1.0");
    return new Response(
      JSON.stringify({ site: { title: "Ghost Demo", url: "https://example.com" } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  const test = await testGhostConnection({
    adminUrl: "https://example.com",
    adminKey: "a".repeat(24) + ":" + "b".repeat(64),
  });
  assert.equal(test.ok, true);
  assert.equal(test.siteTitle, "Ghost Demo");
}

main()
  .then(() => console.log("ghost.test.ts: ok"))
  .finally(() => {
    globalThis.fetch = originalFetch;
  });
