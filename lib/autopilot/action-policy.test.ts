import assert from "node:assert/strict";

import { canExecuteActionAutomatically, decideActionPolicy } from "./action-policy";

assert.equal(decideActionPolicy({ kind: "BLOG_ARTICLE", reversible: true }), "SAFE_AUTO");
assert.equal(decideActionPolicy({ kind: "HOMEPAGE_H1", reversible: true }), "REVIEW_REQUIRED");
assert.equal(decideActionPolicy({ kind: "MASS_DELETE", reversible: true }), "BLOCKED");
assert.equal(
  decideActionPolicy({ kind: "META_DESCRIPTION", reversible: true, touchesLegalOrPricing: true }),
  "REVIEW_REQUIRED"
);
assert.equal(canExecuteActionAutomatically({ mode: "AUTO", policy: "SAFE_AUTO" }), true);
assert.equal(canExecuteActionAutomatically({ mode: "REVIEW", policy: "SAFE_AUTO" }), false);
assert.equal(canExecuteActionAutomatically({ mode: "REVIEW", policy: "REVIEW_REQUIRED", approved: true }), true);
assert.equal(canExecuteActionAutomatically({ mode: "AUTO", policy: "BLOCKED", approved: true }), false);

console.log("autopilot action policy checks passed");
