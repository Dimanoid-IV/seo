import assert from "node:assert/strict";

import { testShopifyConnection } from "./shopify";
import {
  isSafeShopifyDomain,
  normalizeShopifyDomain,
  parseShopifyScopes,
  SHOPIFY_PUBLISHING_KIND,
} from "./shopify-config";

const originalFetch = globalThis.fetch;

async function main() {
  assert.equal(
    normalizeShopifyDomain("https://Demo-Store.myshopify.com/admin"),
    "demo-store.myshopify.com"
  );
  assert.equal(isSafeShopifyDomain("demo-store.myshopify.com"), true);
  assert.equal(isSafeShopifyDomain("localhost.myshopify.com.evil.test"), false);
  assert.equal(isSafeShopifyDomain("demo-store.com"), false);

  const scopes = parseShopifyScopes({
    kind: SHOPIFY_PUBLISHING_KIND,
    shopDomain: "demo-store.myshopify.com",
    blogId: "gid://shopify/Blog/123",
    authorName: "RankBoost",
    testedAt: "2026-08-09T00:00:00.000Z",
  });
  assert.equal(scopes?.shopDomain, "demo-store.myshopify.com");
  assert.equal(scopes?.blogId, "gid://shopify/Blog/123");
  assert.equal(scopes?.authorName, "RankBoost");

  globalThis.fetch = (async (url, init) => {
    assert.equal(
      url,
      "https://demo-store.myshopify.com/admin/api/2026-07/graphql.json"
    );
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      variables?: { blogId?: string };
    };
    assert.equal(body.variables?.blogId, "gid://shopify/Blog/123");
    assert.equal(
      (init?.headers as Record<string, string>)["X-Shopify-Access-Token"],
      "shpat_test_token"
    );
    return new Response(
      JSON.stringify({
        data: {
          shop: { name: "Demo Store", myshopifyDomain: "demo-store.myshopify.com" },
          blog: { id: "gid://shopify/Blog/123", title: "News", handle: "news" },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  const test = await testShopifyConnection({
    shopDomain: "demo-store.myshopify.com",
    blogId: "gid://shopify/Blog/123",
    token: "shpat_test_token",
  });
  assert.equal(test.ok, true);
  assert.equal(test.shopName, "Demo Store");
  assert.equal(test.blogTitle, "News");
}

main()
  .then(() => console.log("shopify.test.ts: ok"))
  .finally(() => {
    globalThis.fetch = originalFetch;
  });
