import assert from "node:assert/strict";

import { parseSitemapLocations } from "./sitemap";

assert.deepEqual(
  parseSitemapLocations("<urlset><url><loc>https://example.com/a</loc></url><url><loc>https://example.com/b</loc></url></urlset>"),
  { urls: ["https://example.com/a", "https://example.com/b"], sitemaps: [] }
);
assert.deepEqual(
  parseSitemapLocations("<sitemapindex><sitemap><loc>https://example.com/pages.xml</loc></sitemap></sitemapindex>"),
  { urls: [], sitemaps: ["https://example.com/pages.xml"] }
);

console.log("sitemap parser checks passed");
