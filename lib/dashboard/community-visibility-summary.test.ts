import assert from "node:assert/strict";

import { buildDashboardCommunityVisibilitySummary } from "./community-visibility-summary";

const summary = buildDashboardCommunityVisibilitySummary({
  href: "/app/autopilot",
  snapshot: {
    hasEnoughSignal: true,
    sourceTopics: ["Topic"],
    sourceKeywords: ["portrait gift", "portrait photo", "canvas portrait", "extra"],
    opportunities: [
      {
        id: "reddit",
        channel: "REDDIT",
        query: 'site:reddit.com "portrait gift"',
        searchUrl:
          "https://www.google.com/search?q=site%3Areddit.com%20%22portrait%20gift%22",
        angle: "Helpful answer only",
      },
      {
        id: "quora",
        channel: "QUORA",
        query: 'site:quora.com "portrait gift"',
        searchUrl:
          "https://www.google.com/search?q=site%3Aquora.com%20%22portrait%20gift%22",
        angle: "Helpful answer only",
      },
      {
        id: "forums",
        channel: "NICHE_FORUMS",
        query: '"portrait gift" forum',
        searchUrl:
          "https://www.google.com/search?q=%22portrait%20gift%22%20forum",
        angle: "Helpful answer only",
      },
      {
        id: "reddit2",
        channel: "REDDIT",
        query: 'site:reddit.com "portrait photo"',
        searchUrl:
          "https://www.google.com/search?q=site%3Areddit.com%20%22portrait%20photo%22",
        angle: "Helpful answer only",
      },
    ],
  },
});

assert.ok(summary);
assert.equal(summary.opportunityCount, 4);
assert.equal(summary.queries.length, 3);
assert.deepEqual(summary.sourceKeywords, [
  "portrait gift",
  "portrait photo",
  "canvas portrait",
]);
assert.equal(summary.href, "/app/autopilot");
assert.ok(
  summary.queries.every((item) =>
    item.searchUrl.startsWith("https://www.google.com/search?q=")
  )
);

assert.equal(
  buildDashboardCommunityVisibilitySummary({
    href: "/app/autopilot",
    snapshot: null,
  }),
  undefined
);

console.log("community-visibility-summary.test.ts: ok");
