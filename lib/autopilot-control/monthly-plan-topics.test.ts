/**
 * Run with: npx tsx lib/autopilot-control/monthly-plan-topics.test.ts
 */
import assert from "node:assert/strict";

import type { MonthlyAutopilotSourceData } from "@/lib/autopilot/source-data";
import type { AutopilotPlanItemsDocument } from "@/lib/autopilot/plan-item-types";

import { replenishControlCenterArticleTopics } from "./monthly-plan-topics";

const sourceData = {
  website: {
    id: "website-1",
    url: "https://popart.ee",
    displayName: "popart.ee",
    primaryLanguage: "ru",
    niche: "portrait gifts",
    currentGrowthScore: 88,
    businessGoals: {
      brandVoice: {
        audience: "люди, ищущие портрет в подарок",
        sellingStyle: "gift-oriented",
        tone: "artistic",
      },
    },
  },
  month: "2026-07",
  growthScore: { latest: 88, previous: 80, delta: 8 },
  audit: {
    id: "audit-1",
    growthScore: 88,
    completedAt: new Date(),
    criticalFindings: [],
    technicalFindings: [],
  },
  tasks: {
    open: [],
    inProgress: [],
    recentlyCompleted: [],
    highPriority: [],
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
    wordpressConnected: false,
    wordpressError: false,
  },
  opportunities: [
    {
      id: "opp-1",
      title: "портрет по фото на холсте",
      description: "Buyer-intent topic for custom portrait gifts.",
      priority: "HIGH",
      type: "CONTENT",
    },
    {
      id: "opp-2",
      title: "портрет по фото в подарок",
      description: "Gift buyer topic.",
      priority: "MEDIUM",
      type: "CONTENT",
    },
  ],
  contentPlan: { hasActivePlan: true, planItemCount: 1 },
  sourceSummary: {
    hasAudit: true,
    hasGsc: false,
    hasBrandVoice: true,
    hasSiteTech: false,
    sourceCount: 2,
  },
} satisfies MonthlyAutopilotSourceData;

const legacyDocument: AutopilotPlanItemsDocument = {
  version: 1,
  period: "monthly",
  items: [
    {
      id: "plan-item-action-3",
      type: "ARTICLE",
      title: "Опубликовать первую статью",
      reason: "Legacy placeholder",
      riskLevel: "low",
      needsIntegration: true,
      integrationType: "wordpress",
      status: "approved",
      selected: true,
      reviewQueueHref: "/app/review",
    },
  ],
};

const replenished = replenishControlCenterArticleTopics({
  document: legacyDocument,
  sourceData,
  wordpressConnected: false,
});

assert.equal(replenished.changed, true);
assert.ok(replenished.json);
assert.ok(replenished.document);
assert.ok(
  replenished.document.items.filter((item) => item.type === "ARTICLE").length >= 3
);
assert.equal(
  replenished.document.items.some(
    (item) => item.type === "ARTICLE" && item.title === "Опубликовать первую статью"
  ),
  false
);
assert.ok(
  replenished.document.items.some((item) => item.id.startsWith("plan-item-auto-topic-"))
);

const secondPass = replenishControlCenterArticleTopics({
  document: replenished.document,
  sourceData,
  wordpressConnected: false,
});
assert.equal(secondPass.changed, false);

console.log("monthly-plan-topics.test.ts: ok");
