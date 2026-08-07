import assert from "node:assert/strict";

import {
  buildPreparedFixForTask,
  parseTaskRecommendationWithFix,
} from "./prepared-fix";

const recommendationJson = {
  expectedAction: "UPDATE_METADATA",
  targetUrl: "https://example.com/service",
  targetQuery: "portrait gift",
  recommendation:
    "Страница уже получает показы, но CTR низкий. Улучшите title и meta description.",
  measured: true,
  metrics: {
    clicks: 1,
    impressions: 500,
    ctr: 0.002,
    position: 8.2,
    period: { startDate: "2026-07-01", endDate: "2026-07-28" },
  },
};

const parsed = parseTaskRecommendationWithFix(recommendationJson);
assert.equal(parsed.expectedAction, "UPDATE_METADATA");
assert.equal(parsed.targetUrl, "https://example.com/service");
assert.equal(parsed.targetQuery, "portrait gift");

const fix = buildPreparedFixForTask({
  taskId: "task-1",
  taskTitle: "Улучшить title/meta для запроса «portrait gift»",
  recommendationJson,
});

assert.equal(fix.type, "META_FIX");
assert.equal(fix.field, "metadata");
assert.equal(fix.requiresIntegration, "wordpress");
assert.equal(fix.status, "AWAITING_REVIEW");
assert.ok(fix.preview.includes("Target page: https://example.com/service"));
assert.ok(fix.preview.includes("Target query: portrait gift"));

const suggested = JSON.parse(fix.suggestedValue) as {
  targetUrl: string;
  targetQuery: string;
  metaTitle: string;
  metaDescription: string;
};

assert.equal(suggested.targetUrl, "https://example.com/service");
assert.equal(suggested.targetQuery, "portrait gift");
assert.ok(suggested.metaTitle.length > 0);
assert.ok(suggested.metaDescription.length > 0);

console.log("GSC prepared metadata fix checks passed");
