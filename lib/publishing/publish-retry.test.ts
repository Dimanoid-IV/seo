import assert from "node:assert/strict";

import {
  hasPublicationVerificationAttemptsRemaining,
  nextPublicationVerificationAt,
  publicationVerificationDelayMs,
} from "./publish-retry";

assert.equal(publicationVerificationDelayMs(1), 60_000);
assert.equal(publicationVerificationDelayMs(2), 5 * 60_000);
assert.equal(publicationVerificationDelayMs(99), 60 * 60_000);
assert.equal(
  nextPublicationVerificationAt(new Date("2026-08-17T10:00:00.000Z"), 3).toISOString(),
  "2026-08-17T10:15:00.000Z"
);
assert.equal(
  hasPublicationVerificationAttemptsRemaining({ attemptCount: 5, maxAttempts: 6 }),
  true
);
assert.equal(
  hasPublicationVerificationAttemptsRemaining({ attemptCount: 6, maxAttempts: 6 }),
  false
);

console.log("publish retry checks passed");
