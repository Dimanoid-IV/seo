/**
 * Run with: npx tsx lib/growth/opportunities-authority.test.ts
 */
import assert from "node:assert/strict";

import {
  buildAuthorityGrowthOpportunities,
  sortGrowthOpportunities,
} from "./opportunities";

assert.deepEqual(
  buildAuthorityGrowthOpportunities({ publishedArticlesCount: 0 }),
  []
);

const opportunities = buildAuthorityGrowthOpportunities({
  publishedArticlesCount: 2,
});

assert.equal(opportunities.length, 2);
assert.equal(opportunities[0]?.id, "authority:mention-opportunities");
assert.equal(opportunities[0]?.type, "AUTHORITY");
assert.equal(opportunities[0]?.createdFrom, "published_content");
assert.equal(opportunities[1]?.id, "community:reddit-discussions");
assert.equal(opportunities[1]?.type, "COMMUNITY");
assert.ok(!opportunities[0]?.description.toLowerCase().includes("buy links"));

const sorted = sortGrowthOpportunities(opportunities);
assert.equal(sorted[0]?.priority, "MEDIUM");

console.log("opportunities-authority.test.ts: ok");
