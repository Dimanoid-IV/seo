import assert from "node:assert/strict";

import { extractGa4Summary, getGa4DateRange } from "./ga4";

const range = getGa4DateRange(28);
assert.match(range.startDate, /^\d{4}-\d{2}-\d{2}$/);
assert.match(range.endDate, /^\d{4}-\d{2}-\d{2}$/);
assert.ok(range.startDate <= range.endDate);

const summary = extractGa4Summary({
  summary: {
    activeUsers: "12",
    sessions: 20,
    screenPageViews: "33",
    conversions: null,
    engagementRate: 0.75,
  },
});
assert.equal(summary?.activeUsers, 12);
assert.equal(summary?.sessions, 20);
assert.equal(summary?.screenPageViews, 33);
assert.equal(summary?.conversions, 0);
assert.equal(summary?.engagementRate, 0.75);

assert.equal(extractGa4Summary(null), null);

console.log("ga4.test.ts: ok");
