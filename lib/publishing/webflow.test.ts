import assert from "node:assert/strict";

import { testWebflowConnection } from "./webflow";
import {
  normalizeWebflowFieldMapping,
  parseWebflowScopes,
  WEBFLOW_PUBLISHING_KIND,
} from "./webflow-config";

const originalFetch = globalThis.fetch;

async function main() {
  globalThis.fetch = (async (url: RequestInfo | URL) => {
    assert.equal(
      String(url),
      "https://api.webflow.com/v2/collections/collection_123"
    );
    return new Response(
      JSON.stringify({
        id: "collection_123",
        displayName: "Blog Posts",
        siteId: "site_123",
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  }) as typeof fetch;

  const test = await testWebflowConnection({
    siteId: "site_123",
    collectionId: "collection_123",
    token: "webflow_test_token",
  });
  assert.equal(test.ok, true);
  assert.equal(test.displayName, "Blog Posts");

  const mapping = normalizeWebflowFieldMapping({ body: "body-rich-text" });
  assert.equal(mapping.name, "name");
  assert.equal(mapping.slug, "slug");
  assert.equal(mapping.body, "body-rich-text");
  assert.equal(mapping.metaTitle, "meta-title");

  const scopes = parseWebflowScopes({
    kind: WEBFLOW_PUBLISHING_KIND,
    siteId: "site_123",
    collectionId: "collection_123",
    fieldMapping: mapping,
    testedAt: "2026-08-09T00:00:00.000Z",
  });
  assert.equal(scopes?.siteId, "site_123");
  assert.equal(scopes?.fieldMapping.body, "body-rich-text");

  console.log("webflow.test.ts: ok");
}

main()
  .finally(() => {
    globalThis.fetch = originalFetch;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
