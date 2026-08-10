import assert from "node:assert/strict";

import { extractKeywordCandidates } from "./keywords";

const extracted = extractKeywordCandidates({
  planItemTitle: "Полное руководство: popart.ee в подарок: как выбрать лучший вариант",
  niche: "портрет по фото на холсте",
  isLocalBusiness: true,
});

assert.equal(
  extracted.some((candidate) => /popart\.ee/i.test(candidate.keyword)),
  false,
  "domain-only plan titles must not become article keywords"
);

const titleExtracted = extractKeywordCandidates({
  planItemTitle: "Полное руководство: портрет по фото на холсте",
  niche: "портрет по фото на холсте",
  isLocalBusiness: true,
});

assert.ok(
  titleExtracted.some(
    (candidate) => candidate.keyword === "портрет по фото на холсте"
  ),
  "the clean product keyword should be preserved"
);
assert.equal(
  titleExtracted.some((candidate) => /полное руководство/i.test(candidate.keyword)),
  false,
  "article title wrappers should be stripped from keywords"
);

console.log("keyword domain guard checks passed");
