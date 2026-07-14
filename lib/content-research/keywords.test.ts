import assert from "node:assert/strict";

import {
  __contentResearchKeywordInternals,
  extractKeywordCandidates,
  isUnsafeArticleTopic,
  pickPrimaryKeyword,
} from "./keywords";

const { isAuditSymptomPhrase } = __contentResearchKeywordInternals;

assert.equal(
  isAuditSymptomPhrase("На странице слишком мало текста для продвижения"),
  true
);
assert.equal(
  isAuditSymptomPhrase("Контента на странице маловато для конкуренции в Google"),
  true
);
assert.equal(isAuditSymptomPhrase("Page has too little text"), true);
assert.equal(isAuditSymptomPhrase("Missing meta description"), true);
assert.equal(
  isUnsafeArticleTopic("На странице слишком мало текста для продвижения"),
  true
);
assert.equal(
  isUnsafeArticleTopic("SEO audit Tallinn for small businesses"),
  false
);

const auditOnlyCandidates = extractKeywordCandidates({
  planItemTitle: "На странице слишком мало текста для продвижения",
  task: {
    title: "На странице слишком мало текста для продвижения",
    description: "Добавьте описание услуг, преимущества, FAQ и призыв к действию.",
  },
  auditFindings: [{ title: "На странице слишком мало текста для продвижения" }],
});

assert.equal(auditOnlyCandidates.length, 0);
assert.equal(pickPrimaryKeyword(auditOnlyCandidates), null);

const businessCandidates = extractKeywordCandidates({
  manualTopic: "SEO audit Tallinn for small businesses",
  planItemTitle: "На странице слишком мало текста для продвижения",
});

assert.equal(
  pickPrimaryKeyword(businessCandidates)?.keyword,
  "SEO audit Tallinn for small businesses"
);

console.log("content research keyword guardrails passed");
