import assert from "node:assert/strict";

import { signWordPressPing, verifyWordPressPingSignature } from "./wordpress-ping-signature";

const body = JSON.stringify({ siteUrl: "https://example.com", pluginVersion: "1.0.0" });
const timestamp = "1700000000";
const signature = signWordPressPing(body, "secret", timestamp);
assert.equal(verifyWordPressPingSignature({ body, secret: "secret", timestamp, signature, nowMs: 1_700_000_100_000 }), true);
assert.equal(verifyWordPressPingSignature({ body, secret: "wrong", timestamp, signature, nowMs: 1_700_000_100_000 }), false);
assert.equal(verifyWordPressPingSignature({ body, secret: "secret", timestamp, signature, nowMs: 1_700_000_301_000 }), false);

console.log("WordPress ping signature checks passed");
