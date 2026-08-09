import assert from "node:assert/strict";

import { extractGbpSummary } from "./gbp";
import { normalizeBusinessProfileId } from "@/lib/google/business-profile";

assert.equal(normalizeBusinessProfileId("accounts/12345"), "12345");
assert.equal(normalizeBusinessProfileId("locations/98765"), "98765");
assert.equal(normalizeBusinessProfileId("  abc_def-123  "), "abc_def-123");

const summary = extractGbpSummary({
  location: {
    name: "accounts/1/locations/2",
    title: "PopArt",
    websiteUri: "https://popart.ee",
    primaryPhone: "+372",
    address: "Tallinn, EE",
    primaryCategory: "Portrait artist",
  },
});
assert.equal(summary?.title, "PopArt");
assert.equal(summary?.websiteUri, "https://popart.ee");
assert.equal(summary?.primaryCategory, "Portrait artist");

assert.equal(extractGbpSummary(null), null);
assert.equal(extractGbpSummary({}), null);

console.log("gbp.test.ts: ok");
