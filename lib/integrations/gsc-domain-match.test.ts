import assert from "node:assert/strict";

import {
  findHighConfidenceGscProperties,
  gscPropertyMatchesWebsite,
  normalizeWebsiteDomain,
  rankGscPropertiesForWebsite,
  scoreGscPropertyMatch,
} from "./gsc-domain-match";

assert.equal(normalizeWebsiteDomain("https://www.popart.ee/"), "popart.ee");
assert.equal(normalizeWebsiteDomain("sc-domain:popart.ee"), "popart.ee");
assert.equal(normalizeWebsiteDomain("http://popart.ee"), "popart.ee");

assert.equal(
  gscPropertyMatchesWebsite("sc-domain:popart.ee", "https://www.popart.ee/"),
  true
);
assert.equal(
  gscPropertyMatchesWebsite("http://popart.ee", "https://www.popart.ee/"),
  true
);
assert.equal(
  gscPropertyMatchesWebsite("sc-domain:other.com", "https://popart.ee/"),
  false
);

assert.equal(
  scoreGscPropertyMatch("sc-domain:popart.ee", "https://popart.ee"),
  "high"
);
assert.equal(
  scoreGscPropertyMatch("https://www.popart.ee/", "https://popart.ee"),
  "high"
);
assert.equal(
  scoreGscPropertyMatch("https://popart.ee/blog/", "https://popart.ee"),
  "medium"
);

const ranked = rankGscPropertiesForWebsite(
  [
    { siteUrl: "sc-domain:other.com" },
    { siteUrl: "sc-domain:popart.ee" },
    { siteUrl: "https://popart.ee/blog/" },
  ],
  "https://www.popart.ee/"
);

assert.equal(ranked[0]?.siteUrl, "sc-domain:popart.ee");
assert.equal(ranked[0]?.recommended, true);
assert.equal(ranked[1]?.matchConfidence, "medium");

const highMatches = findHighConfidenceGscProperties(
  [
    { siteUrl: "sc-domain:popart.ee" },
    { siteUrl: "https://www.popart.ee/" },
  ],
  "https://popart.ee"
);
assert.equal(highMatches.length, 2);

console.log("gsc domain match checks passed");
