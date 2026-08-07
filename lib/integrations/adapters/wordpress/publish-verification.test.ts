import assert from "node:assert/strict";

import { verifyWordPressPublishedPost } from "./publish-article";

const originalFetch = globalThis.fetch;

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function main() {
  globalThis.fetch = async () =>
    htmlResponse(`
    <html>
      <head><title>Portrait Gift Guide</title></head>
      <body>
        <h1>Portrait Gift Guide</h1>
        <p>Choose a portrait gift with clear pricing examples delivery and ordering advice.</p>
      </body>
    </html>
  `);

  const verified = await verifyWordPressPublishedPost({
    publicUrl: "https://example.com/portrait-gift-guide/",
    expectedTitle: "Portrait Gift Guide",
    expectedContentHtml:
      "<p>Choose a portrait gift with clear pricing examples delivery and ordering advice.</p>",
  });

  assert.equal(verified.verified, true);
  assert.equal(verified.checks.statusOk, true);
  assert.equal(verified.checks.titleFound, true);
  assert.equal(verified.checks.contentSignalFound, true);

  globalThis.fetch = async () => htmlResponse("<h1>Different page</h1>");

  const mismatch = await verifyWordPressPublishedPost({
    publicUrl: "https://example.com/portrait-gift-guide/",
    expectedTitle: "Portrait Gift Guide",
    expectedContentHtml:
      "<p>Choose a portrait gift with clear pricing examples delivery and ordering advice.</p>",
  });

  assert.equal(mismatch.verified, false);
  assert.equal(mismatch.errorCode, "published_content_not_verified");

  globalThis.fetch = async () => htmlResponse("Not found", 404);

  const notFound = await verifyWordPressPublishedPost({
    publicUrl: "https://example.com/portrait-gift-guide/",
    expectedTitle: "Portrait Gift Guide",
    expectedContentHtml:
      "<p>Choose a portrait gift with clear pricing examples delivery and ordering advice.</p>",
  });

  assert.equal(notFound.verified, false);
  assert.equal(notFound.statusCode, 404);
  assert.equal(notFound.errorCode, "public_url_not_ok");

  const missingUrl = await verifyWordPressPublishedPost({
    publicUrl: null,
    expectedTitle: "Portrait Gift Guide",
    expectedContentHtml:
      "<p>Choose a portrait gift with clear pricing examples delivery and ordering advice.</p>",
  });

  assert.equal(missingUrl.verified, false);
  assert.equal(missingUrl.errorCode, "missing_public_url");

  globalThis.fetch = originalFetch;

  console.log("WordPress publish verification checks passed");
}

main().catch((error) => {
  globalThis.fetch = originalFetch;
  throw error;
});
