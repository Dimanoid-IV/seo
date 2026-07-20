import assert from "node:assert/strict";

import { renderHostedSitemap } from "./sitemap";

const xml = renderHostedSitemap([
  {
    url: "https://www.rankboost.eu/hosted/articles/1/a&b",
    lastModified: new Date("2026-07-21T00:00:00.000Z"),
  },
]);

assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
assert.match(xml, /https:\/\/www\.rankboost\.eu\/hosted\/articles\/1\/a&amp;b/);
assert.match(xml, /<lastmod>2026-07-21T00:00:00\.000Z<\/lastmod>/);

const empty = renderHostedSitemap([]);
assert.match(empty, /<urlset/);
assert.doesNotMatch(empty, /<url>/);

console.log("hosted-blog sitemap.test.ts: ok");
