/**
 * Run with: npx tsx lib/autopilot/ai-visibility-snapshot.test.ts
 */
import assert from "node:assert/strict";

import { buildAutopilotAiVisibilitySnapshot } from "./ai-visibility-snapshot";
import type { AutopilotPlanItemsDocument } from "./plan-item-types";

const document: AutopilotPlanItemsDocument = {
  version: 1,
  period: "monthly",
  items: [
    {
      id: "article-1",
      type: "ARTICLE",
      title: "Portrait from photo",
      reason: "Buyer search",
      riskLevel: "low",
      needsIntegration: false,
      integrationType: "none",
      status: "approved",
      researchBrief: {
        geoPrompts: [
          {
            prompt: "Which studio should I choose for a portrait from photo?",
            platform: "CHAT_GPT",
            desiredMentionAngle: "Compare trusted portrait studios",
          },
          {
            prompt: "Best portrait gift for anniversary?",
            platform: "CLAUDE",
            desiredMentionAngle: "Gift-oriented recommendation",
          },
          {
            prompt: "Compare custom portrait providers",
            platform: "PERPLEXITY",
            desiredMentionAngle: "Objective comparison",
          },
          {
            prompt: "Where can I order a canvas portrait?",
            platform: "GEMINI",
            desiredMentionAngle: "Transactional intent",
          },
          {
            prompt: "Where can I order a canvas portrait?",
            platform: "GEMINI",
          },
        ],
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

{
  const snapshot = buildAutopilotAiVisibilitySnapshot({
    document,
    readinessScore: 83,
  });
  assert.ok(snapshot);
  assert.equal(snapshot.readinessScore, 83);
  assert.equal(snapshot.promptCount, 4);
  assert.equal(snapshot.status, "ready");
  assert.equal(snapshot.coverage.CHATGPT, true);
  assert.equal(snapshot.coverage.CLAUDE, true);
  assert.equal(snapshot.coverage.PERPLEXITY, true);
  assert.equal(snapshot.coverage.GEMINI, true);
  assert.equal(snapshot.coverage.GOOGLE_AI, false);
  assert.deepEqual(snapshot.platforms.slice(0, 4), [
    "CHATGPT",
    "CLAUDE",
    "PERPLEXITY",
    "GEMINI",
  ]);
  assert.equal(snapshot.prompts.length, 4);
  assert.equal(snapshot.mentionAngles.length, 4);
}

{
  const snapshot = buildAutopilotAiVisibilitySnapshot({
    document: {
      version: 1,
      period: "monthly",
      items: [
        {
          id: "article-1",
          type: "ARTICLE",
          title: "Topic",
          reason: "Reason",
          riskLevel: "low",
          needsIntegration: false,
          integrationType: "none",
          status: "approved",
          researchBrief: {
            geoPrompts: [
              {
                prompt: "What should I know?",
                platform: "GOOGLE_AI_MODE",
              },
            ],
          },
        },
      ],
    },
    readinessScore: 40,
  });
  assert.ok(snapshot);
  assert.equal(snapshot.status, "needs_work");
  assert.equal(snapshot.coverage.GOOGLE_AI, true);
}

assert.equal(
  buildAutopilotAiVisibilitySnapshot({ document: null, readinessScore: null }),
  null
);

console.log("ai-visibility-snapshot.test.ts: ok");
