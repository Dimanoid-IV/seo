import assert from "node:assert/strict";

import { buildDashboardAiVisibilitySummary } from "./ai-visibility-summary";

const summary = buildDashboardAiVisibilitySummary({
  href: "/app/autopilot",
  snapshot: {
    readinessScore: 88,
    promptCount: 4,
    platforms: ["CHATGPT", "CLAUDE", "GENERIC"],
    prompts: ["Question 1", "Question 2", "Question 3"],
    mentionAngles: [],
    coverage: {
      CHATGPT: true,
      CLAUDE: true,
      PERPLEXITY: false,
      GEMINI: false,
      GOOGLE_AI: false,
      GENERIC: true,
    },
    status: "building",
  },
});

assert.deepEqual(summary, {
  href: "/app/autopilot",
  readinessScore: 88,
  promptCount: 4,
  status: "building",
  prompts: ["Question 1", "Question 2"],
  platformCount: 2,
});

assert.equal(
  buildDashboardAiVisibilitySummary({
    href: "/app/autopilot",
    snapshot: null,
  }),
  undefined
);

console.log("ai-visibility-summary.test.ts: ok");
