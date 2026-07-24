import assert from "node:assert/strict";

import {
  discoverCompetitors,
  normalizeManualCompetitors,
  parseManualCompetitorsFromBusinessGoals,
  readManualCompetitorsFromBusinessGoals,
  writeManualCompetitorsIntoBusinessGoals,
} from "./competitors";

const normalized = normalizeManualCompetitors({
  websiteUrl: "https://www.popart.ee",
  competitors: [
    "https://competitor-one.ee/gallery",
    "www.competitor-two.com",
    "https://popart.ee/blog",
    "competitor-one.ee",
    "",
  ],
});

assert.deepEqual(
  normalized.map((item) => item.domain),
  ["competitor-one.ee", "competitor-two.com"]
);

const goals = writeManualCompetitorsIntoBusinessGoals(
  {
    brandVoice: {
      examples: ["See https://not-a-competitor.example in old notes"],
    },
  },
  normalized
);

assert.deepEqual(parseManualCompetitorsFromBusinessGoals(goals), [
  "https://competitor-one.ee/gallery",
  "https://competitor-two.com",
]);

assert.deepEqual(
  readManualCompetitorsFromBusinessGoals(goals).map((item) => item.domain),
  ["competitor-one.ee", "competitor-two.com"]
);

const discovered = discoverCompetitors({
  websiteUrl: "https://popart.ee",
  manualCompetitors: parseManualCompetitorsFromBusinessGoals(goals),
});

assert.equal(discovered.unavailable, false);
assert.deepEqual(
  discovered.competitors.map((item) => item.domain),
  ["competitor-one.ee", "competitor-two.com"]
);

const unrelatedGoals = {
  brandVoice: { examples: ["Ignore https://example.com because it is not explicit"] },
};
assert.deepEqual(parseManualCompetitorsFromBusinessGoals(unrelatedGoals), []);

console.log("competitors tests passed");
