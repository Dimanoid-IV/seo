import assert from "node:assert/strict";

import { generateGeoPrompts } from "./geo-prompts";

const prompts = generateGeoPrompts({
  primaryKeyword: "Полное руководство: popart.ee в подарок: как выбрать лучший вариант",
  searchIntent: "COMMERCIAL",
  niche: "портрет по фото на холсте",
  businessName: "popart.ee",
  locale: "ru",
});

assert.ok(prompts.length >= 5);
assert.ok(
  prompts.every((item) => !/popart\.ee/i.test(item.prompt)),
  "domain must not be treated as the product in GEO prompts"
);
assert.ok(
  prompts.some((item) => /портрет по фото|портрет.*холсте/i.test(item.prompt)),
  "GEO prompts should use the real product/service subject"
);
assert.ok(
  prompts.every((item) => !/малого бизнеса/i.test(item.prompt)),
  "consumer gift prompts should not default to small-business wording"
);

const titlePrompts = generateGeoPrompts({
  primaryKeyword: "Полное руководство: портрет по фото на холсте",
  searchIntent: "COMMERCIAL",
  locale: "ru",
});

assert.ok(
  titlePrompts.every((item) => !/полное руководство/i.test(item.prompt)),
  "article title wrappers must not leak into buyer prompts"
);

console.log("geo-prompts product-subject checks passed");
