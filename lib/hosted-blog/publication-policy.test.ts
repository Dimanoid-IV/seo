import assert from "node:assert/strict";

import { isPubliclyPublished } from "./publication-policy";

const today = new Date("2026-08-17T12:00:00.000Z");

assert.equal(
  isPubliclyPublished({
    status: "PUBLISHED",
    publishedAt: "2026-10-20T00:00:00.000Z",
    now: today,
  }),
  false
);
assert.equal(
  isPubliclyPublished({
    status: "SCHEDULED",
    publishedAt: "2026-08-16T00:00:00.000Z",
    now: today,
  }),
  false
);
assert.equal(
  isPubliclyPublished({
    status: "PUBLISHED",
    publishedAt: "2026-08-17T11:59:59.000Z",
    now: today,
  }),
  true
);

console.log("hosted publication policy checks passed");
