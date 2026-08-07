import assert from "node:assert/strict";

import { findGscPageQueryOpportunities } from "./gsc-opportunities";

const opportunities = findGscPageQueryOpportunities({
  period: { startDate: "2026-07-01", endDate: "2026-07-28" },
  pageQueries: [
    {
      keys: ["https://example.com/service", "portrait gift"],
      page: "https://example.com/service",
      query: "portrait gift",
      clicks: 1,
      impressions: 500,
      ctr: 0.002,
      position: 8.2,
    },
    {
      keys: ["https://example.com/blog", "portrait ideas"],
      page: "https://example.com/blog",
      query: "portrait ideas",
      clicks: 12,
      impressions: 200,
      ctr: 0.06,
      position: 5.4,
    },
    {
      keys: ["https://example.com/low", "tiny"],
      page: "https://example.com/low",
      query: "tiny",
      clicks: 0,
      impressions: 5,
      ctr: 0,
      position: 12,
    },
  ],
});

assert.equal(opportunities.length, 2);
assert.equal(opportunities[0]?.kind, "LOW_CTR_PAGE_QUERY");
assert.equal(opportunities[0]?.priority, "HIGH");
assert.equal(opportunities[0]?.measured, true);
assert.equal(opportunities[1]?.kind, "NEAR_PAGE_ONE_PAGE_QUERY");
assert.ok(opportunities[0]?.recommendation.includes("500 показов"));

console.log("GSC page/query opportunities checks passed");
