import assert from "node:assert/strict";

import { getRequestClientAddress } from "./rate-limit";

assert.equal(
  getRequestClientAddress(new Request("https://example.com", {
    headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
  })),
  "203.0.113.9"
);
assert.equal(
  getRequestClientAddress(new Request("https://example.com", {
    headers: { "cf-connecting-ip": "198.51.100.4", "x-forwarded-for": "203.0.113.9" },
  })),
  "198.51.100.4"
);

console.log("rate limit checks passed");
