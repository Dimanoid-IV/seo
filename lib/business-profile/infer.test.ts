import assert from "node:assert/strict";

import { inferBusinessProfile } from "./infer";

const profile = inferBusinessProfile({
  siteUrl: "https://popart.ee",
  primaryLanguage: "RU",
  pages: [
    { url: "https://popart.ee/", pageType: "HOME", title: "PopArt.ee | Portraits", description: "Portraits from photos", h1: "Portraits from photos", locale: "en", schema: { "@type": "Organization", name: "PopArt.ee" } },
    { url: "https://popart.ee/services/portrait", pageType: "SERVICE", title: "Portrait service", description: null, h1: "Portrait from photo", locale: "en", schema: [] },
  ],
});
assert.equal(profile.businessName, "PopArt.ee");
assert.equal(profile.country, "EE");
assert.deepEqual(profile.languages.sort(), ["en", "ru"]);
assert.equal(profile.services.length, 1);
assert.ok(profile.confidence >= 0.7);

console.log("business profile inference checks passed");
