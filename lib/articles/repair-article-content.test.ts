import assert from "node:assert";

import type { ContentResearchBrief } from "@/lib/content-research/types";
import type { HermesArticleDraftResult } from "@/lib/hermes/types";

import {
  analyzeQualityRepairability,
  articleHasCta,
  countArticleWords,
  guardHumanizedArticle,
  isDeterministicallyRepairable,
  repairArticleForQuality,
} from "./repair-article-content";
import { validateResearchAwareArticle } from "./research-quality-gates";
import type { ArticleQualityReport } from "./research-generation-types";

const brief: ContentResearchBrief = {
  id: "brief-test",
  websiteId: "w1",
  organizationId: "o1",
  source: "AUTOPILOT_PLAN",
  targetUrl: "https://popart.ee",
  primaryKeyword: "портрет по фото на холсте",
  secondaryKeywords: ["портрет по фото", "холст на подрамнике"],
  searchIntent: "COMMERCIAL",
  buyerQuestion: "Как заказать портрет по фото на холсте?",
  geoPrompts: [],
  competitors: [],
  competitorsUnavailable: true,
  contentGapSummary: "Раскрыть тему портрета по фото на холсте.",
  recommendedArticleTitle: "Портрет по фото на холсте: полное руководство",
  outline: ["Введение", "Форматы", "Как выбрать", "FAQ"],
  faq: ["Сколько стоит?", "Сколько занимает?", "Как заказать?"],
  internalLinkSuggestions: ["/", "/services"],
  schemaSuggestions: ["Article", "FAQPage"],
  evidence: [],
  qualityRequirements: [],
  riskLevel: "LOW",
  status: "READY_FOR_GENERATION",
  generatedAt: new Date().toISOString(),
};

// A short RU draft with no CTA — the exact failure mode we saw in production.
const shortArticle: HermesArticleDraftResult = {
  title: "Портрет по фото на холсте: полное практическое руководство",
  slug: "portret-po-foto-na-holste",
  metaTitle: "Портрет по фото на холсте: как выбрать",
  metaDescription:
    "Разбираем, как выбрать и заказать портрет по фото на холсте: форматы, размеры, оформление и на что обратить внимание перед покупкой.",
  contentHtml: [
    "<h2>Что такое портрет по фото на холсте</h2>",
    "<p>Портрет по фото на холсте — это изображение, созданное на основе вашей фотографии и перенесённое на холст. Такой формат подходит для подарка и для украшения интерьера, сохраняя тёплые воспоминания надолго.</p>",
    "<h2>Форматы и размеры</h2>",
    "<p>Перед выбором определите размер и ориентацию. Небольшой формат подойдёт для полки, большой — для стены в гостиной. Портрет по фото на холсте можно оформить в разных пропорциях.</p>",
    "<h2>На что обратить внимание</h2>",
    "<p>Качество исходной фотографии влияет на итог: чем выше разрешение, тем детальнее результат. Портрет по фото на холсте служит долго при качественных материалах.</p>",
  ].join(""),
  faqJson: [
    { question: "Сколько стоит?", answer: "Зависит от размера и оформления." },
    { question: "Сколько занимает?", answer: "Зависит от сложности заказа." },
    { question: "Какое фото нужно?", answer: "Подойдёт чёткое фото в хорошем разрешении." },
  ],
  schemaJson: { "@type": "Article" },
};

const repairCtx = {
  brief,
  website: { url: "https://popart.ee", niche: null, language: "ru" },
  targetKeyword: "портрет по фото на холсте",
  minWords: 900,
  targetWords: 1150,
};

// --- Quality gate detects the failure ---------------------------------------
const failReport = validateResearchAwareArticle(shortArticle, {
  targetKeyword: "портрет по фото на холсте",
  brief,
  evidenceNotesCount: 1,
});
assert.equal(failReport.passed, false, "short + no-CTA draft must fail");
const failingCodes = failReport.checks
  .filter((c) => !c.passed && c.severity === "error")
  .map((c) => c.key);
assert.ok(failingCodes.includes("cta_missing"), "detects missing CTA");
assert.ok(
  failingCodes.includes("content_word_count"),
  "detects word count below 900"
);
assert.ok(failingCodes.includes("min_length"), "detects short content");

// --- Repairability classifier ------------------------------------------------
assert.equal(
  isDeterministicallyRepairable(failReport),
  true,
  "length + CTA failures are repairable"
);

// Non-repairable errors (fake guarantees / AI phrasing / missing title) must
// NOT be treated as repairable — the article stays honestly blocked.
const unsafeReport: ArticleQualityReport = {
  score: 60,
  passed: false,
  threshold: 80,
  validatedAt: new Date().toISOString(),
  revisionNotes: [],
  checks: [
    { key: "cta_missing", label: "CTA", passed: false, severity: "error", message: "" },
    {
      key: "no_fake_guarantees",
      label: "Guarantees",
      passed: false,
      severity: "error",
      message: "",
    },
  ],
};
assert.equal(
  isDeterministicallyRepairable(unsafeReport),
  false,
  "must not repair fake-guarantee failures"
);
assert.deepEqual(
  analyzeQualityRepairability(unsafeReport).nonRepairableCodes,
  ["no_fake_guarantees"]
);

const missingTitleReport: ArticleQualityReport = {
  score: 50,
  passed: false,
  threshold: 80,
  validatedAt: new Date().toISOString(),
  revisionNotes: [],
  checks: [
    { key: "min_length", label: "Length", passed: false, severity: "error", message: "" },
    { key: "has_title", label: "Title", passed: false, severity: "error", message: "" },
  ],
};
assert.equal(
  isDeterministicallyRepairable(missingTitleReport),
  false,
  "must not repair when the title itself is missing"
);

// --- Repair expands content and adds a CTA ----------------------------------
const repaired = repairArticleForQuality(shortArticle, repairCtx);
assert.ok(
  countArticleWords(repaired.contentHtml) >= 900,
  `repair expands to >= 900 words (got ${countArticleWords(repaired.contentHtml)})`
);
assert.equal(articleHasCta(repaired.contentHtml), true, "repair adds a CTA");

const passReport = validateResearchAwareArticle(repaired, {
  targetKeyword: "портрет по фото на холсте",
  brief,
  evidenceNotesCount: 1,
});
assert.equal(
  passReport.passed,
  true,
  `repaired article passes the gate (score ${passReport.score})`
);

// --- Humanizer safety floor --------------------------------------------------
const longWithCta = repairArticleForQuality(shortArticle, repairCtx);
const shrunkHumanized: HermesArticleDraftResult = {
  ...shortArticle,
  contentHtml: "<h2>Коротко</h2><p>Слишком короткий текст без призыва.</p>",
};
const guarded = guardHumanizedArticle(longWithCta, shrunkHumanized, repairCtx);
assert.ok(
  countArticleWords(guarded.contentHtml) >= 900,
  "humanizer guard keeps minimum length"
);
assert.equal(
  articleHasCta(guarded.contentHtml),
  true,
  "humanizer guard preserves CTA"
);

// Guard re-adds a CTA when the humanizer kept length but dropped the CTA.
const longNoCta: HermesArticleDraftResult = {
  ...longWithCta,
  contentHtml: longWithCta.contentHtml.replace(/<h2>Как заказать[\s\S]*$/i, ""),
};
const guardedCta = guardHumanizedArticle(longWithCta, longNoCta, repairCtx);
assert.equal(
  articleHasCta(guardedCta.contentHtml),
  true,
  "guard restores CTA the humanizer removed"
);

console.log("repair-article-content checks passed");
