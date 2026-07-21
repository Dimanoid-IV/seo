import assert from "node:assert/strict";

import { buildHostedArticleJsonLd } from "./json-ld";
import type { HostedPublicArticle } from "./public-article";

const baseArticle: HostedPublicArticle = {
  id: "article-1",
  websiteId: "website-1",
  title: "Портрет по фото на холсте",
  slug: "portret-po-foto-na-holste",
  language: "ru",
  metaTitle: "Портрет по фото на холсте",
  metaDescription: "Как заказать портрет по фото на холсте.",
  targetKeyword: "портрет по фото на холсте",
  canonicalUrl:
    "https://www.rankboost.eu/hosted/articles/article-1/portret-po-foto-na-holste",
  bodyHtml: "<p>Article</p>",
  publishedAt: new Date("2026-07-21T00:00:00.000Z"),
  updatedAt: new Date("2026-07-21T01:00:00.000Z"),
  websiteUrl: "https://www.popart.ee",
  hostedUrl:
    "https://www.rankboost.eu/hosted/articles/article-1/portret-po-foto-na-holste",
};

const jsonLd = buildHostedArticleJsonLd(baseArticle);

assert.equal(jsonLd["@context"], "https://schema.org");
assert.equal(jsonLd["@type"], "BlogPosting");
assert.equal(jsonLd.headline, "Портрет по фото на холсте");
assert.equal(jsonLd.inLanguage, "ru");
assert.deepEqual(jsonLd.author, {
  "@type": "Organization",
  name: "popart.ee",
  url: "https://www.popart.ee",
});
assert.deepEqual(jsonLd.keywords, ["портрет по фото на холсте"]);
assert.equal(jsonLd.dateModified, "2026-07-21T01:00:00.000Z");

const noKeyword = buildHostedArticleJsonLd({
  ...baseArticle,
  targetKeyword: "   ",
});
assert.equal(noKeyword.keywords, undefined);

console.log("hosted-blog json-ld.test.ts: ok");
