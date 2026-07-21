import assert from "node:assert/strict";

import {
  buildPlanItemsFromSource,
  ensureStrategicArticleTopicDepth,
  isNonStrategicArticlePlanItem,
} from "./plan-items";
import type { MonthlyAutopilotSourceData } from "./source-data";

const baseSource: MonthlyAutopilotSourceData = {
  website: {
    id: "site-1",
    url: "https://popart.ee",
    displayName: "PopArt",
    primaryLanguage: "RU",
    niche: "портрет по фото на холсте",
    currentGrowthScore: 88,
    businessGoals: {
      brandVoice: {
        language: "ru",
        audience: "люди, ищущие портрет или художественный подарок",
        tone: "artistic",
        formality: "neutral",
        sellingStyle: "gift-oriented",
        commonPhrases: ["портрет по фото", "подарок на годовщину"],
        forbiddenPhrases: [],
        ctaStyle: "Заказать портрет",
        examples: [],
        confidence: "high",
        sourceUrls: ["https://popart.ee"],
        updatedAt: "2026-07-20T00:00:00.000Z",
      },
    },
  },
  month: "2026-07",
  growthScore: { latest: 88, previous: 80, delta: 8 },
  audit: {
    id: "audit-1",
    growthScore: 88,
    completedAt: new Date("2026-07-20T00:00:00.000Z"),
    criticalFindings: [
      {
        id: "finding-1",
        title: "На странице слишком мало текста",
        category: "CONTENT",
      },
    ],
    technicalFindings: [],
  },
  tasks: {
    open: [
      {
        id: "task-1",
        title: "На странице слишком мало текста",
        description: "Добавьте описание услуг и FAQ",
        priority: "HIGH",
        category: "CONTENT",
        source: "AUDIT",
      },
    ],
    inProgress: [],
    recentlyCompleted: [],
    highPriority: [
      {
        id: "task-1",
        title: "На странице слишком мало текста",
        priority: "HIGH",
        category: "CONTENT",
      },
    ],
  },
  gsc: {
    connected: false,
    hasError: false,
    lastErrorMessage: null,
    metricsSummary: null,
    opportunityCount: 0,
  },
  articles: {
    drafts: [],
    waitingReview: [],
    recentlyCreated: [],
    wordpressDrafts: [],
  },
  socialPosts: { ready: [], drafts: [], copied: [] },
  timeline: { recent: [], warnings: [], opportunities: [] },
  integrations: {
    gscConnected: false,
    gscError: false,
    wordpressConnected: true,
    wordpressError: false,
  },
  opportunities: [],
  contentPlan: { hasActivePlan: false, planItemCount: 0 },
  sourceSummary: {
    hasAudit: true,
    hasGsc: false,
    hasTasks: true,
    hasArticles: false,
    hasSocialPosts: false,
    hasTimelineEvents: false,
    hasOpportunities: false,
    hasEnoughData: true,
  },
};

const plan = buildPlanItemsFromSource(baseSource);
const articleItems = plan.items.filter((item) => item.type === "ARTICLE");

assert.ok(
  articleItems.length >= 3,
  `expected at least 3 strategic article topics, got ${articleItems.length}`
);
assert.ok(
  articleItems.every((item) => !/слишком мало текста/i.test(item.title)),
  "audit symptom must not become an article title"
);
assert.ok(
  articleItems.some((item) => /портрет|подарок|заказать/i.test(item.title)),
  "strategic topics should use buyer/business language"
);
assert.ok(
  articleItems.every((item) => /конкурент|GEO|AI|buyer query/i.test(item.reason)),
  "article reasons should explain competitor/GEO/research basis"
);

const legacyReplenished = ensureStrategicArticleTopicDepth({
  document: {
    version: 1,
    period: "monthly",
    items: [
      {
        id: "legacy-article-1",
        type: "ARTICLE",
        title: "портрет по фото на холсте",
        reason: "Legacy single topic",
        riskLevel: "low",
        needsIntegration: false,
        integrationType: "none",
        status: "approved",
      },
    ],
  },
  data: baseSource,
  articleIntegration: "none",
});

const replenishedArticles = legacyReplenished.document.items.filter(
  (item) => item.type === "ARTICLE"
);
assert.ok(legacyReplenished.addedCount >= 2);
assert.ok(replenishedArticles.length >= 3);
assert.ok(
  replenishedArticles.every((item) => !/слишком мало текста/i.test(item.title)),
  "replenished legacy plan must not use audit symptoms as topics"
);
assert.equal(legacyReplenished.removedNonStrategicArticleCount, 0);

const placeholderReplenished = ensureStrategicArticleTopicDepth({
  document: {
    version: 1,
    period: "monthly",
    items: [
      {
        id: "legacy-placeholder",
        type: "ARTICLE",
        title: "Опубликовать первую статью",
        reason: "Legacy placeholder",
        riskLevel: "low",
        needsIntegration: false,
        integrationType: "none",
        status: "approved",
      },
      {
        id: "legacy-audit-symptom",
        type: "ARTICLE",
        title: "На странице слишком мало текста",
        reason: "Audit symptom accidentally mapped to article",
        riskLevel: "low",
        needsIntegration: false,
        integrationType: "none",
        status: "approved",
      },
    ],
  },
  data: baseSource,
  articleIntegration: "none",
});

assert.equal(
  placeholderReplenished.document.items.some(
    (item) =>
      item.type === "ARTICLE" &&
      (/опубликовать первую статью/i.test(item.title) ||
        /слишком мало текста/i.test(item.title))
  ),
  false,
  "legacy placeholders and audit symptoms must be removed from article plan"
);
assert.ok(
  placeholderReplenished.removedNonStrategicArticleCount >= 2,
  "legacy placeholder/audit-symptom removal should be reported"
);
assert.ok(
  placeholderReplenished.document.items.filter((item) => item.type === "ARTICLE")
    .length >= 3,
  "removed non-strategic topics should be replaced with strategic article topics"
);
assert.equal(
  isNonStrategicArticlePlanItem({
    type: "ARTICLE",
    title: "На странице слишком мало текста",
    status: "approved",
  }),
  true
);
assert.equal(
  isNonStrategicArticlePlanItem({
    type: "ARTICLE",
    title: "портрет по фото на холсте",
    status: "approved",
  }),
  false
);

console.log("strategic article opportunities for monthly plan passed");
