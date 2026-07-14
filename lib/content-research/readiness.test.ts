import assert from "node:assert/strict";

import {
  analyzeResearchBriefReadiness,
  isResearchBriefReadyForArticleGeneration,
} from "./readiness";

function readyBrief(overrides: Record<string, unknown> = {}) {
  return {
    id: "brief-1",
    websiteId: "website-1",
    organizationId: "org-1",
    source: "AUTOPILOT_PLAN",
    primaryKeyword: "SEO audit Tallinn",
    secondaryKeywords: [],
    searchIntent: "COMMERCIAL",
    buyerQuestion: "How much does an SEO audit cost in Tallinn?",
    geoPrompts: [
      {
        prompt: "Best SEO audit provider in Tallinn",
        platform: "CHATGPT",
        desiredMentionAngle: "Local expertise",
      },
    ],
    competitors: [],
    contentGapSummary: "Competitors cover pricing better.",
    recommendedArticleTitle: "SEO audit Tallinn pricing guide",
    outline: ["Intro", "Pricing factors"],
    faq: ["How long does an audit take?"],
    internalLinkSuggestions: ["/services"],
    schemaSuggestions: ["FAQPage"],
    evidence: [],
    qualityRequirements: ["Include local context"],
    riskLevel: "LOW",
    status: "READY_FOR_GENERATION",
    generatedAt: "2026-07-11T10:00:00.000Z",
    ...overrides,
  };
}

const pollutedBrief = readyBrief({
  primaryKeyword: "На странице слишком мало текста для продвижения",
  recommendedArticleTitle:
    "Полное руководство: На странице слишком мало текста для продвижения",
});

assert.equal(isResearchBriefReadyForArticleGeneration(null), false);
assert.equal(isResearchBriefReadyForArticleGeneration({ version: 1 }), false);
assert.equal(
  isResearchBriefReadyForArticleGeneration(
    readyBrief({ status: "BLOCKED", blockedReason: "No keyword" })
  ),
  false
);
assert.equal(
  isResearchBriefReadyForArticleGeneration(readyBrief({ status: "DRAFT" })),
  false
);
assert.equal(isResearchBriefReadyForArticleGeneration(readyBrief()), true);
assert.equal(isResearchBriefReadyForArticleGeneration(pollutedBrief), false);
assert.equal(
  analyzeResearchBriefReadiness(pollutedBrief).reasonKey,
  "unsafePrimaryKeyword"
);
assert.equal(
  analyzeResearchBriefReadiness(
    readyBrief({
      primaryKeyword: "SEO audit Tallinn",
      recommendedArticleTitle: "Missing meta description on homepage",
    })
  ).reasonKey,
  "unsafeRecommendedTitle"
);

console.log("content research readiness checks passed");
