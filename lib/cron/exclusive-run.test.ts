import assert from "node:assert/strict";

import { cronBucketKey } from "./exclusive-run";

assert.equal(cronBucketKey("autopilot", new Date("2026-08-17T12:09:59Z"), 600_000), cronBucketKey("autopilot", new Date("2026-08-17T12:00:01Z"), 600_000));
assert.notEqual(cronBucketKey("autopilot", new Date("2026-08-17T12:10:00Z"), 600_000), cronBucketKey("autopilot", new Date("2026-08-17T12:09:59Z"), 600_000));

console.log("cron bucket idempotency checks passed");
