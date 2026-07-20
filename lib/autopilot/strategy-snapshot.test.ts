/**
 * Run with: npx tsx lib/autopilot/strategy-snapshot.test.ts
 */
import assert from "node:assert/strict";

import { buildAutopilotStrategySnapshot } from "./strategy-snapshot";
import type { AutopilotPlanItemsDocument } from "./plan-item-types";

const document: AutopilotPlanItemsDocument = {
  version: 1,
  period: "monthly",
  items: [
    {
      id: "article-1",
      type: "ARTICLE",
      title: "Portrait gift guide",
      reason: "Search demand",
      riskLevel: "low",
      needsIntegration: false,
      integrationType: "none",
      status: "approved",
      researchBrief: {
        primaryKeyword: "portrait from photo",
        secondaryKeywords: ["portrait gift", "custom portrait"],
        competitors: [
          { domain: "competitor.example" },
          { url: "https://studio.example/blog" },
        ],
        geoPrompts: [{ prompt: "best portrait gift in Tallinn" }],
      },
    },
    {
      id: "fix-1",
      type: "SEO_FIX",
      title: "Add FAQ schema",
      reason: "Search appearance",
      riskLevel: "low",
      needsIntegration: false,
      integrationType: "none",
      status: "approved",
    },
  ],
};

const snapshot = buildAutopilotStrategySnapshot(document);
assert.ok(snapshot);
assert.equal(snapshot.articleCount, 1);
assert.equal(snapshot.fixCount, 1);
assert.deepEqual(snapshot.keywords.slice(0, 2), [
  "portrait from photo",
  "portrait gift",
]);
assert.deepEqual(snapshot.competitors, [
  "competitor.example",
  "https://studio.example/blog",
]);
assert.deepEqual(snapshot.geoPrompts, ["best portrait gift in Tallinn"]);
assert.equal(snapshot.hasResearch, true);

assert.equal(buildAutopilotStrategySnapshot(null), null);

console.log("strategy-snapshot.test.ts: ok");
