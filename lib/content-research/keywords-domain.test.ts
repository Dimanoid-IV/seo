import assert from "node:assert/strict";

import { extractKeywordCandidates } from "./keywords";

const extracted = extractKeywordCandidates({
  planItemTitle: "popart.ee в подарок: как выбрать лучший вариант",
  niche: "портрет по фото на холсте",
  isLocalBusiness: true,
});

assert.equal(
  extracted.some((candidate) => /popart\.ee/i.test(candidate.keyword)),
  false,
  "domain-only plan titles must not become article keywords"
);

console.log("keyword domain guard checks passed");
