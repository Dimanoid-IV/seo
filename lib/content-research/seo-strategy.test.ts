import assert from "node:assert/strict";

import { ArticleStatus } from "@prisma/client";

import { analyzeResearchBriefReadiness } from "./readiness";
import {
  appendSeoStrategyQualityRequirements,
  buildSeoStrategySnapshot,
  hasPublishableSeoEvidence,
} from "./seo-strategy";
import type { ContentResearchBrief } from "./types";
import type { ResearchSourceContext } from "./source-context";

function context(overrides: Partial<ResearchSourceContext> = {}): ResearchSourceContext {
  return {
    website: {
      id: "website-1",
      url: "https://example.com",
      displayName: "Example",
      niche: "portrait painting",
      primaryLanguage: "RU",
      businessGoals: {},
    },
    organizationId: "org-1",
    gscConnected: false,
    gscInsightTitles: [],
    opportunities: [],
    contentTasks: [],
    auditFindings: [],
    articles: [],
    metadataDomains: [],
    focusAreaTitles: [],
    ...overrides,
  };
}

const strongStrategy = buildSeoStrategySnapshot({
  context: context({
    gscConnected: true,
    opportunities: [
      {
        title: "портрет по фото",
        description: "Buyer query opportunity",
        type: "GSC",
      },
    ],
    contentTasks: [
      {
        id: "task-1",
        title: "Add portrait examples",
        description: "Content opportunity",
        recommendationJson: {},
      },
    ],
  }),
  locale: "ru",
  primaryKeyword: "портрет по фото на холсте",
  secondaryKeywords: ["портрет по фото в подарок", "заказать портрет по фото"],
  searchIntent: "COMMERCIAL",
  buyerQuestion: "Как выбрать портрет по фото на холсте?",
  competitors: [
    {
      domain: "competitor-one.example",
      name: "Competitor One",
      reason: "Ranks for portrait query",
      observedStrengths: ["Examples"],
      contentAngles: ["Show process"],
    },
    {
      domain: "competitor-two.example",
      name: "Competitor Two",
      reason: "Ranks for gift query",
      observedStrengths: ["Gift angle"],
      contentAngles: ["Explain delivery"],
    },
  ],
  competitorsUnavailable: false,
  generatedAt: "2026-08-07T10:00:00.000Z",
});

assert.equal(strongStrategy.confidence, "HIGH");
assert.equal(strongStrategy.doNotPublishYet.length, 0);
assert.equal(strongStrategy.pageMap[0]?.demand, "OBSERVED");
assert.equal(strongStrategy.pageMap[0]?.businessValue, "HIGH");
assert.ok(
  strongStrategy.assumptions.some((item) =>
    item.includes("Объёмы") || item.includes("Volume")
  )
);
assert.equal(hasPublishableSeoEvidence({ seoStrategy: strongStrategy }), true);

const weakStrategy = buildSeoStrategySnapshot({
  context: context(),
  locale: "ru",
  primaryKeyword: "портрет",
  secondaryKeywords: [],
  searchIntent: "INFORMATIONAL",
  buyerQuestion: "Что такое портрет?",
  competitors: [],
  competitorsUnavailable: true,
  generatedAt: "2026-08-07T10:00:00.000Z",
});

assert.equal(weakStrategy.confidence, "LOW");
assert.ok(weakStrategy.doNotPublishYet.length > 0);
assert.equal(weakStrategy.pageMap[0]?.demand, "INFERRED");
assert.equal(hasPublishableSeoEvidence({ seoStrategy: weakStrategy }), false);

const requirements = appendSeoStrategyQualityRequirements(["No fake claims"], weakStrategy);
assert.ok(requirements.includes("No fake claims"));
assert.ok(requirements.some((item) => item.includes("Do not invent keyword volume")));
assert.ok(requirements.some((item) => item.includes("do not auto-publish")));

function readyBrief(strategy: ContentResearchBrief["seoStrategy"]) {
  return {
    id: "brief-1",
    websiteId: "website-1",
    organizationId: "org-1",
    source: "AUTOPILOT_PLAN",
    primaryKeyword: "портрет по фото на холсте",
    secondaryKeywords: [],
    searchIntent: "COMMERCIAL",
    buyerQuestion: "Как выбрать портрет по фото на холсте?",
    geoPrompts: [
      {
        prompt: "Лучший портрет по фото на холсте",
        platform: "CHATGPT",
        desiredMentionAngle: "Gift portrait service",
      },
    ],
    competitors: [],
    contentGapSummary: "Need a stronger buying guide.",
    recommendedArticleTitle: "Портрет по фото на холсте: как выбрать",
    outline: ["Intro", "How to choose"],
    faq: ["How to order?"],
    internalLinkSuggestions: ["/"],
    schemaSuggestions: ["Article"],
    evidence: [],
    seoStrategy: strategy,
    qualityRequirements: [],
    riskLevel: "LOW",
    status: "READY_FOR_GENERATION",
    generatedAt: "2026-08-07T10:00:00.000Z",
  };
}

assert.equal(analyzeResearchBriefReadiness(readyBrief(strongStrategy)).ready, true);
assert.equal(
  analyzeResearchBriefReadiness(readyBrief(weakStrategy)).reasonKey,
  "weakSeoEvidence"
);
assert.equal(
  analyzeResearchBriefReadiness(readyBrief(strongStrategy), {
    linkedArticle: { status: ArticleStatus.ARCHIVED, qualityPassed: true },
  }).reasonKey,
  "archivedLinkedArticle"
);

console.log("SEO strategy checks passed");
