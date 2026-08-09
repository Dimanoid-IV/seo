import assert from "node:assert/strict";

import { IntegrationProvider } from "@prisma/client";

import { INTEGRATION_CATALOG } from "./catalog";
import { INTEGRATION_PROVIDER_DETAILS } from "./provider-details";

const requiredProviders = [
  "google_search_console",
  "google_analytics",
  "google_business_profile",
  "wordpress",
  "custom_webhook",
  "hosted_blog",
  "webflow",
  "shopify",
  "wix",
  "squarespace",
  "ghost",
  "github",
  "sitemap",
  "zapier",
  "make",
] as const;

const byProvider = new Map(
  INTEGRATION_CATALOG.map((entry) => [entry.provider, entry])
);

for (const provider of requiredProviders) {
  const entry = byProvider.get(provider);
  assert.ok(entry, `${provider} must be present in the integration catalog`);
  assert.ok(entry.title.trim(), `${provider} must have a title`);
  assert.ok(entry.description.trim(), `${provider} must have a description`);
  assert.ok(entry.category, `${provider} must have a category`);
  assert.ok(
    entry.capabilities.length > 0,
    `${provider} must declare at least one capability`
  );
  assert.ok(
    INTEGRATION_PROVIDER_DETAILS[provider],
    `${provider} must have side-panel provider details`
  );
  assert.ok(
    entry.dbProvider === null || entry.dbProvider in IntegrationProvider,
    `${provider} dbProvider must map to Prisma IntegrationProvider`
  );
}

assert.equal(
  byProvider.get("custom_webhook")?.available,
  true,
  "custom webhook is a production publishing path"
);
assert.equal(
  byProvider.get("hosted_blog")?.available,
  true,
  "hosted blog is a production fallback publishing path"
);
assert.equal(
  byProvider.get("sitemap")?.platformManaged,
  true,
  "sitemap discovery should not ask for credentials"
);
assert.equal(
  byProvider.get("google_business_profile")?.available,
  true,
  "Google Business Profile read-only local SEO data should be available"
);
assert.equal(
  byProvider.get("wix")?.available,
  true,
  "Wix draft publishing should be available"
);
assert.equal(
  byProvider.get("squarespace")?.available,
  true,
  "Squarespace guided publishing should be available"
);

console.log("integrations catalog.test.ts: ok");
