import assert from "node:assert/strict";

import {
  inspectPublishedHtml,
  isUrlAllowedByRobotsTxt,
  sitemapContainsPublicUrl,
} from "./publish-verification";

const verified = inspectPublishedHtml({
  finalUrl: "https://www.popart.ee/ru/blog/portrait-guide",
  expectedUrl: "https://www.popart.ee/ru/blog/portrait-guide",
  statusCode: 200,
  expectedTitle: "Как выбрать портрет",
  expectedContentHtml:
    "<p>Выберите качественную фотографию, проверьте композицию, освещение, размер и доставку.</p>",
  html: `<!doctype html><html><head>
    <title>Как выбрать портрет | PopArt.ee</title>
    <link rel="canonical" href="https://www.popart.ee/ru/blog/portrait-guide" />
    <meta name="robots" content="index,follow" />
  </head><body><h1>Как выбрать портрет</h1><p>Выберите качественную фотографию,
  проверьте композицию, освещение, размер и доставку.</p></body></html>`,
});

assert.equal(verified.verified, true);
assert.equal(verified.checks.canonicalMatches, true);
assert.equal(verified.checks.indexable, true);

const futurePlaceholder = inspectPublishedHtml({
  finalUrl: "https://www.popart.ee/ru/blog/portrait-guide",
  expectedUrl: "https://www.popart.ee/ru/blog/portrait-guide",
  statusCode: 200,
  expectedTitle: "Как выбрать портрет",
  expectedContentHtml: "<p>Ожидаемый уникальный текст статьи для проверки.</p>",
  html: `<html><head><title>Blog</title><meta name="robots" content="noindex" /></head>
    <body><h1>Материал ещё не опубликован</h1></body></html>`,
});

assert.equal(futurePlaceholder.verified, false);
assert.equal(futurePlaceholder.checks.contentMarkerFound, false);
assert.equal(futurePlaceholder.checks.canonicalMatches, false);
assert.equal(futurePlaceholder.checks.indexable, false);

assert.equal(
  isUrlAllowedByRobotsTxt({
    publicUrl: "https://www.popart.ee/ru/blog/portrait-guide",
    robotsTxt: "User-agent: *\nDisallow: /admin\nSitemap: https://www.popart.ee/sitemap.xml",
  }),
  true
);
assert.equal(
  isUrlAllowedByRobotsTxt({
    publicUrl: "https://www.popart.ee/ru/blog/portrait-guide",
    robotsTxt: "User-agent: *\nDisallow: /ru/blog/",
  }),
  false
);
assert.equal(
  sitemapContainsPublicUrl({
    publicUrl: "https://www.popart.ee/ru/blog/portrait-guide",
    sitemapXml:
      "<?xml version=\"1.0\"?><urlset><url><loc>https://www.popart.ee/ru/blog/portrait-guide/</loc></url></urlset>",
  }),
  true
);

console.log("publish verification checks passed");
