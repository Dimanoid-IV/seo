import assert from "node:assert/strict";

import {
  buildHostedArticlePath,
  buildHostedArticleSlug,
} from "./urls";

assert.equal(
  buildHostedArticleSlug({
    title: "Портрет по фото на холсте",
    slug: null,
  }),
  "portret-po-foto-na-holste"
);

assert.equal(
  buildHostedArticlePath({
    articleId: "11111111-1111-1111-1111-111111111111",
    title: "My Article",
    slug: "custom-slug",
  }),
  "/hosted/articles/11111111-1111-1111-1111-111111111111/custom-slug"
);

console.log("hosted-blog urls.test.ts: ok");
