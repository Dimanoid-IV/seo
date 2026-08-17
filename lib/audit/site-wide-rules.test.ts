import assert from "node:assert/strict";

import { runSiteWideAuditRules, type SiteWidePageFact } from "./site-wide-rules";

const pages: SiteWidePageFact[] = [
  { url: "https://example.com/", title: "Example", metaDescription: "Home", h1Count: 1, wordCount: 600, pageType: "HOME", canonicalUrl: "https://example.com/", indexable: true, inSitemap: true, crawlDepth: 0, contentHash: "home", internalLinks: ["https://example.com/blog/a"], missingAlt: 0, schemaTypes: ["Organization"], hreflangCount: 0, redirectTarget: null, failed: false },
  { url: "https://example.com/blog/a", title: "Same", metaDescription: null, h1Count: 0, wordCount: 120, pageType: "BLOG", canonicalUrl: null, indexable: true, inSitemap: true, crawlDepth: 1, contentHash: "duplicate", internalLinks: [], missingAlt: 2, schemaTypes: [], hreflangCount: 0, redirectTarget: null, failed: false },
  { url: "https://example.com/blog/b", title: "Same", metaDescription: null, h1Count: 2, wordCount: 120, pageType: "BLOG", canonicalUrl: "https://example.com/blog/b", indexable: true, inSitemap: true, crawlDepth: 4, contentHash: "duplicate", internalLinks: [], missingAlt: 0, schemaTypes: [], hreflangCount: 0, redirectTarget: null, failed: false },
];

const failed = runSiteWideAuditRules(pages).filter((check) => check.status === "FAIL");
assert.ok(failed.some((check) => check.code === "SITE_DUPLICATE_TITLES"));
assert.ok(failed.some((check) => check.code === "SITE_ORPHAN_PAGES"));
assert.ok(failed.some((check) => check.code === "SITE_DUPLICATE_CONTENT"));
assert.ok(failed.some((check) => check.code === "SITE_DEEP_PAGES"));

console.log("site-wide audit checks passed");
