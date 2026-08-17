import assert from "node:assert/strict";

import { extractCrawlDocument, inferPageType, normalizeCrawlUrl } from "./document";

assert.equal(normalizeCrawlUrl("/blog/post/?utm_source=x#part", "https://Example.com"), "https://example.com/blog/post");
assert.equal(inferPageType("https://example.com/services/seo"), "SERVICE");

const page = extractCrawlDocument(`<!doctype html><html lang="et"><head>
  <title>Portree fotost</title><meta name="description" content=" Kunstiline portree ">
  <link rel="canonical" href="/et/portree"><link rel="alternate" hreflang="en" href="/en/portrait">
  <script type="application/ld+json">{"@type":"Product"}</script>
</head><body><h1>Portree fotost</h1><h2>Kuidas tellida</h2><a href="/et/hind?utm_medium=test">Hind</a>
<a href="https://other.example/source">Source</a><img src="/portrait.jpg" alt="Portree"></body></html>`, "https://example.com/et/portree");

assert.equal(page.locale, "et");
assert.equal(page.canonicalUrl, "https://example.com/et/portree");
assert.deepEqual(page.internalLinks, ["https://example.com/et/hind"]);
assert.deepEqual(page.internalLinkDetails, [{ url: "https://example.com/et/hind", anchor: "Hind" }]);
assert.equal(page.externalLinks.length, 1);
assert.equal(page.headings.length, 2);
assert.equal(page.images[0]?.alt, "Portree");
assert.equal(page.indexable, true);

console.log("crawler document checks passed");
