import assert from "node:assert/strict";

import { buildPlanItemsFromRecommendedActions } from "./plan-items";

const document = buildPlanItemsFromRecommendedActions({
  recommendedActions: [
    {
      id: "review-1",
      title: "Review thin content task",
      description: "Audit finding needs review, not article generation.",
      type: "REVIEW",
    },
    {
      id: "article-1",
      title: "SEO audit Tallinn for small businesses",
      description: "Create a content draft from a real content opportunity.",
      type: "ARTICLE",
    },
  ],
  taskIds: [],
  articleIds: [],
  socialPostIds: [],
});

assert.equal(document.items[0]?.type, "SEO_FIX");
assert.equal(document.items[0]?.needsIntegration, false);
assert.equal(document.items[1]?.type, "ARTICLE");
assert.equal(document.items[1]?.needsIntegration, true);

console.log("autopilot plan item mapping guardrails passed");
