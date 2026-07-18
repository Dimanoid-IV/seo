import assert from "node:assert/strict";

import { detectSiteTech } from "./detect-site-tech";

// WordPress via wp-content + generator meta.
const wp = detectSiteTech({
  html: `<!doctype html><html><head>
    <meta name="generator" content="WordPress 6.5.2" />
    <link rel="stylesheet" href="/wp-content/themes/x/style.css" />
    <link rel="https://api.w.org/" href="/wp-json/" />
  </head><body></body></html>`,
  headers: { "x-pingback": "https://example.com/xmlrpc.php" },
  url: "https://example.com",
});
assert.equal(wp.platform, "wordpress");
assert.equal(wp.canPublishNatively, true);
assert.equal(wp.recommendedPublishing, "wordpress");
assert.ok(wp.confidence >= 0.7);
assert.ok(wp.signals.includes("generator-meta"));

// WordPress via headers only (link header carrying wp-json).
const wpHeaderOnly = detectSiteTech({
  html: "<html><head></head><body>hello</body></html>",
  headers: { link: '</wp-json/>; rel="https://api.w.org/"' },
});
assert.equal(wpHeaderOnly.platform, "wordpress");

// Shopify via cdn + Shopify.theme + header.
const shopify = detectSiteTech({
  html: `<html><head><script src="https://cdn.shopify.com/s/files/1/theme.js"></script>
    <script>window.Shopify = window.Shopify || {}; Shopify.theme = {"name":"Dawn"};</script>
  </head></html>`,
  headers: { "x-shopid": "12345", "powered-by": "Shopify" },
});
assert.equal(shopify.platform, "shopify");
assert.equal(shopify.canPublishNatively, false);
assert.equal(shopify.recommendedPublishing, "universal");

// Webflow via data-wf-domain + webflow.js.
const webflow = detectSiteTech({
  html: `<html data-wf-domain="example.webflow.io" data-wf-page="123">
    <head><script src="https://assets.website-files.com/js/webflow.js"></script></head></html>`,
});
assert.equal(webflow.platform, "webflow");
assert.equal(webflow.recommendedPublishing, "universal");

// Wix via wixstatic + header.
const wix = detectSiteTech({
  html: `<html><head><img src="https://static.wixstatic.com/media/x.png" /></head></html>`,
  headers: { "x-wix-request-id": "abc" },
});
assert.equal(wix.platform, "wix");

// Tilda via tildacdn + generator.
const tilda = detectSiteTech({
  html: `<html><head><meta name="generator" content="Tilda" />
    <link href="https://static.tildacdn.com/css/tilda-grid-3.0.min.css" rel="stylesheet" /></head></html>`,
});
assert.equal(tilda.platform, "tilda");

// Unknown / custom fallback is never a dead-end: recommend universal publishing.
const unknown = detectSiteTech({
  html: `<html><head><title>Bespoke site</title></head><body><h1>Hi</h1></body></html>`,
  headers: { server: "nginx" },
});
assert.equal(unknown.platform, "unknown");
assert.equal(unknown.confidence, 0);
assert.equal(unknown.canPublishNatively, false);
assert.equal(unknown.recommendedPublishing, "universal");

// Empty input does not throw and returns unknown.
const empty = detectSiteTech({});
assert.equal(empty.platform, "unknown");

// A single weak signal below threshold stays unknown (avoids false positives).
const weak = detectSiteTech({ html: "<html><body>tilda.cc mentioned in a blog post</body></html>" });
assert.equal(weak.platform, "unknown");

console.log("site tech detection checks passed");
