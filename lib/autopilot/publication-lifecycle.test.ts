import assert from "node:assert/strict";

import { isPublicPublication, publicationStatusForTime } from "./publication-lifecycle";

const now = new Date("2026-08-17T12:00:00.000Z");
assert.equal(publicationStatusForTime({ now, scheduledAt: new Date("2026-10-20T00:00:00.000Z"), publishedAt: null, currentStatus: "READY" }), "SCHEDULED");
assert.equal(isPublicPublication({ now, publishedAt: new Date("2026-10-20T00:00:00.000Z"), verified: true }), false);
assert.equal(isPublicPublication({ now, publishedAt: new Date("2026-08-16T00:00:00.000Z"), verified: false }), false);
assert.equal(isPublicPublication({ now, publishedAt: new Date("2026-08-16T00:00:00.000Z"), verified: true }), true);

console.log("publication lifecycle checks passed");
