/**
 * Run: npx tsx lib/integrations/adapters/wordpress/update-metadata.test.ts
 */
import assert from "node:assert/strict";

import {
  findWordPressContentByUrl,
  mapMetadataUpdateToWpRestPayload,
  parsePreparedMetadataValue,
  updateWordPressCoreMetadata,
  verifyWordPressMetadataUpdate,
} from "./update-metadata";

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

const credentials = {
  siteUrl: "https://example.com",
  username: "editor",
  applicationPassword: "abcd efgh",
};

async function main() {
  // --- parses structured metadata fix ---
  {
    const parsed = parsePreparedMetadataValue(
      JSON.stringify({
        targetUrl: "https://example.com/blog/portrait-guide/",
        targetQuery: "портрет по фото",
        metaTitle: "Портрет по фото на холсте",
        metaDescription: "Как заказать портрет по фото на холсте в подарок.",
      })
    );

    assert.equal(parsed.targetUrl, "https://example.com/blog/portrait-guide/");
    assert.equal(parsed.targetQuery, "портрет по фото");
    assert.equal(parsed.metaTitle, "Портрет по фото на холсте");
  }

  // --- rejects unstructured prepared fix values ---
  {
    assert.throws(
      () => parsePreparedMetadataValue("plain text"),
      /структурированные metadata/
    );
    assert.throws(
      () =>
        parsePreparedMetadataValue(
          JSON.stringify({ targetUrl: "https://example.com/a" })
        ),
      /targetUrl, metaTitle и metaDescription/
    );
  }

  // --- WordPress payload updates core title/excerpt only, never publish ---
  {
    const payload = mapMetadataUpdateToWpRestPayload({
      targetUrl: "https://example.com/blog/portrait-guide/",
      metaTitle: "SEO title",
      metaDescription: "SEO description",
    });
    assert.deepEqual(payload, {
      title: "SEO title",
      excerpt: "SEO description",
    });
    assert.equal("status" in payload, false);
  }

  // --- finds posts by slug before pages ---
  {
    const urls: string[] = [];
    globalThis.fetch = (async (url: RequestInfo | URL) => {
      urls.push(String(url));
      return jsonResponse([
        {
          id: 12,
          link: "https://example.com/blog/portrait-guide/",
          status: "publish",
        },
      ]);
    }) as typeof fetch;

    const target = await findWordPressContentByUrl(
      credentials,
      "https://example.com/blog/portrait-guide/"
    );

    assert.equal(target.objectType, "posts");
    assert.equal(target.postId, "12");
    assert.equal(urls.length, 1);
    assert.match(urls[0], /\/posts\?/);
    assert.match(urls[0], /slug=portrait-guide/);
  }

  // --- falls back to pages and applies update without publish status ---
  {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      const current = String(url);
      if (current.includes("/posts?")) return jsonResponse([]);
      if (current.includes("/pages?")) {
        return jsonResponse([
          {
            id: 44,
            link: "https://example.com/services/portraits/",
            status: "publish",
          },
        ]);
      }
      if (current.includes("/pages/44")) {
        assert.equal(init?.method, "POST");
        const body = JSON.parse(String(init?.body));
        assert.deepEqual(body, {
          title: "Портрет по фото",
          excerpt: "Подарочный портрет по фото на холсте.",
        });
        assert.equal("status" in body, false);
        return jsonResponse({
          id: 44,
          link: "https://example.com/services/portraits/",
          status: "publish",
          title: { rendered: "Портрет по фото" },
          excerpt: { rendered: "Подарочный портрет по фото на холсте." },
        });
      }
      return jsonResponse({}, 404);
    }) as typeof fetch;

    const result = await updateWordPressCoreMetadata(credentials, {
      targetUrl: "https://example.com/services/portraits/",
      metaTitle: "Портрет по фото",
      metaDescription: "Подарочный портрет по фото на холсте.",
    });

    assert.equal(result.objectType, "pages");
    assert.equal(result.postId, "44");
    assert.equal(result.titleUpdated, true);
    assert.equal(result.excerptUpdated, true);
    assert.equal(calls.length, 3);
  }

  // --- verification requires both public title and meta description ---
  {
    globalThis.fetch = (async () =>
      htmlResponse(`<!doctype html>
        <html>
          <head>
            <title>Портрет по фото на холсте</title>
            <meta name="description" content="Как заказать портрет по фото на холсте в подарок.">
          </head>
          <body><h1>Портрет по фото на холсте</h1></body>
        </html>`)) as typeof fetch;

    const result = await verifyWordPressMetadataUpdate({
      publicUrl: "https://example.com/blog/portrait-guide/",
      expectedTitle: "Портрет по фото на холсте",
      expectedMetaDescription:
        "Как заказать портрет по фото на холсте в подарок.",
    });

    assert.equal(result.verified, true);
    assert.equal(result.checks.titleFound, true);
    assert.equal(result.checks.metaDescriptionFound, true);
  }

  // --- partial when WP page omits meta description ---
  {
    globalThis.fetch = (async () =>
      htmlResponse(`<!doctype html>
        <html><head><title>Портрет по фото на холсте</title></head></html>`)) as typeof fetch;

    const result = await verifyWordPressMetadataUpdate({
      publicUrl: "https://example.com/blog/portrait-guide/",
      expectedTitle: "Портрет по фото на холсте",
      expectedMetaDescription:
        "Как заказать портрет по фото на холсте в подарок.",
    });

    assert.equal(result.verified, false);
    assert.equal(result.checks.titleFound, true);
    assert.equal(result.checks.metaDescriptionFound, false);
    assert.equal(result.errorCode, "metadata_not_verified_publicly");
  }

  // --- refuses cross-domain target updates ---
  {
    await assert.rejects(
      () =>
        findWordPressContentByUrl(
          credentials,
          "https://attacker.example.net/blog/portrait-guide/"
        ),
      /не относится к подключённому WordPress/
    );
  }

  console.log("update-metadata tests passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
  globalThis.fetch = originalFetch;
  });
