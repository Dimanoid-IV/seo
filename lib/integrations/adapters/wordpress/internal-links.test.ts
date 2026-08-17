/** Run with: NODE_OPTIONS='--conditions=react-server' npx tsx lib/integrations/adapters/wordpress/internal-links.test.ts */
import assert from "node:assert/strict";

import { insertContextualInternalLink } from "./internal-links";

const first = insertContextualInternalLink({
  html: '<p>A custom portrait makes a meaningful gift.</p><p><a href="/shop">Shop</a></p>',
  sourceUrl: "https://example.com/blog/gifts",
  targetUrl: "https://example.com/portraits",
  anchor: "custom portrait",
});
assert.equal(first.changed, true);
assert.match(first.html, /<a href="https:\/\/example\.com\/portraits">custom portrait<\/a>/);

const second = insertContextualInternalLink({
  html: first.html,
  sourceUrl: "https://example.com/blog/gifts",
  targetUrl: "https://example.com/portraits",
  anchor: "custom portrait",
});
assert.equal(second.changed, false);
assert.equal(second.alreadyApplied, true);

const protectedCode = insertContextualInternalLink({
  html: "<pre>custom portrait</pre><p>No match here.</p>",
  sourceUrl: "https://example.com/blog/gifts",
  targetUrl: "https://example.com/portraits",
  anchor: "custom portrait",
});
assert.equal(protectedCode.changed, false);

console.log("internal-links.test.ts: ok");
