/**
 * Run with: npx tsx lib/autopilot/community-visibility.test.ts
 */
import assert from "node:assert/strict";

import {
  buildCommunitySearchUrl,
  buildCommunityVisibilitySnapshot,
} from "./community-visibility";
import type { AutopilotStrategySnapshot } from "./strategy-snapshot";

const strategy = {
  articleCount: 3,
  fixCount: 1,
  keywords: ["portrait from photo", "portrait gift"],
  competitors: ["competitor.example"],
  geoPrompts: ["best portrait gift"],
  articleTitles: [
    "Complete guide: portrait from photo",
    "Where to order portrait gift",
  ],
  hasResearch: true,
} satisfies AutopilotStrategySnapshot;

const snapshot = buildCommunityVisibilitySnapshot(strategy);
assert.ok(snapshot);
assert.equal(snapshot.hasEnoughSignal, true);
assert.deepEqual(snapshot.sourceKeywords.slice(0, 2), [
  "portrait from photo",
  "portrait gift",
]);
assert.ok(snapshot.opportunities.some((item) => item.channel === "REDDIT"));
assert.ok(snapshot.opportunities.some((item) => item.channel === "QUORA"));
assert.ok(snapshot.opportunities.some((item) => item.channel === "NICHE_FORUMS"));
assert.ok(snapshot.opportunities.every((item) => item.query.includes('"')));
assert.ok(
  snapshot.opportunities.every((item) =>
    item.searchUrl.startsWith("https://www.google.com/search?q=")
  )
);
assert.ok(
  snapshot.opportunities.every(
    (item) => item.searchUrl === buildCommunitySearchUrl(item.query)
  )
);
assert.ok(
  snapshot.opportunities.every((item) => !/javascript:/i.test(item.searchUrl))
);
assert.ok(
  snapshot.opportunities.every((item) => !/spam|buy links/i.test(item.angle))
);

assert.equal(buildCommunityVisibilitySnapshot(null), null);
assert.equal(
  buildCommunityVisibilitySnapshot({
    articleCount: 0,
    fixCount: 1,
    keywords: [],
    competitors: [],
    geoPrompts: [],
    articleTitles: [],
    hasResearch: false,
  }),
  null
);

console.log("community-visibility.test.ts: ok");
