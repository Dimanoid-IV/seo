import assert from "node:assert/strict";
import { impactConfidence, relativeChange, summarizeMetricPoints } from "./action-impact";

const summary = summarizeMetricPoints([
  { date: new Date("2026-01-01"), impressions: 100, clicks: 10, position: 8 },
  { date: new Date("2026-01-02"), impressions: 200, clicks: 30, position: 5 },
]);
assert.equal(summary.impressions, 300);
assert.equal(summary.ctr, 40 / 300);
assert.equal(Math.round((summary.position ?? 0) * 10) / 10, 6);
assert.equal(relativeChange(10, 15), 0.5);
assert.equal(relativeChange(0, 15), null);
assert.equal(impactConfidence(14, 7), 0.4);
console.log("action impact checks passed");
