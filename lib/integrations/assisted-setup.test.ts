import assert from "node:assert/strict";

import { assistedSetupFormSchema } from "../validators";

const validPayload = {
  name: "Test User",
  email: "test@example.com",
  websiteUrl: "https://popart.ee",
  integrationType: "GOOGLE_SEARCH_CONSOLE" as const,
  issueType: "NO_PROPERTY_FOUND" as const,
  comment: "Need help",
  consentGiven: true as const,
  locale: "en" as const,
  sourcePage: "/app/integrations",
};

assert.equal(assistedSetupFormSchema.safeParse(validPayload).success, true);

assert.equal(
  assistedSetupFormSchema.safeParse({ ...validPayload, email: "not-an-email" })
    .success,
  false
);

assert.equal(
  assistedSetupFormSchema.safeParse({ ...validPayload, websiteUrl: "not a url" })
    .success,
  false
);

assert.equal(
  assistedSetupFormSchema.safeParse({ ...validPayload, consentGiven: false })
    .success,
  false
);

assert.equal(
  assistedSetupFormSchema.safeParse({
    ...validPayload,
    name: "A",
    websiteUrl: "",
  }).success,
  false
);

console.log("assisted setup form validation checks passed");
