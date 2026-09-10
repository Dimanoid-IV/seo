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

const launchCandidates = extractKeywordCandidates({
  planItemTitle: "портрет по фото на холсте: как выбрать лучший вариант",
  planItemReason: "Тема построена вокруг покупательского запроса: исследование проверит конкурентов.",
  opportunities: [{ type: "CONTENT", title: "Опубликовать первую статью", description: "На сайте ещё нет опубликованных статей. Опубликуйте первый материал, чтобы начать получать органический трафик." }],
  gscInsightTitles: ["подарок на день рождения"],
});
assert.equal(pickPrimaryKeyword(launchCandidates)?.keyword, "портрет по фото на холсте", "a plan brief must research its own selected topic, not a generic opportunity");
assert.equal(launchCandidates.some(candidate => candidate.keyword.includes("Опубликуйте") || candidate.keyword.includes("Тема построена")), false);
for (const instruction of [
  "На сайте ещё нет опубликованных статей. Опубликуйте первый материал, чтобы начать получать органический трафик.",
  "Your website has no published articles. Publish your first article to get organic traffic.",
  "Подключите Search Console, чтобы RankBoost видел реальные клики и показы.",
  "Instant Magic",
]) assert.equal(isUnsafeArticleTopic(instruction), true, instruction);
