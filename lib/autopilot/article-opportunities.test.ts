import assert from "node:assert/strict";

import { buildPlanItemsFromSource } from "./plan-items";
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

console.log("strategic article opportunities for monthly plan passed");
