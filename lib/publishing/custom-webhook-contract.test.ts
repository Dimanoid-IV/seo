import assert from "node:assert/strict";

import {
  buildCustomWebhookDeveloperBrief,
  CUSTOM_WEBHOOK_HEADERS_EXAMPLE,
  CUSTOM_WEBHOOK_PAYLOAD_EXAMPLE,
  CUSTOM_WEBHOOK_SUCCESS_RESPONSE_EXAMPLE,
} from "./custom-webhook-contract";

assert.match(CUSTOM_WEBHOOK_HEADERS_EXAMPLE, /X-RankBoost-Event: article\.ready/);
assert.match(CUSTOM_WEBHOOK_HEADERS_EXAMPLE, /X-RankBoost-Signature/);
assert.match(CUSTOM_WEBHOOK_PAYLOAD_EXAMPLE, /"event": "article\.ready"/);
assert.match(CUSTOM_WEBHOOK_PAYLOAD_EXAMPLE, /"brandKit"/);
assert.match(CUSTOM_WEBHOOK_SUCCESS_RESPONSE_EXAMPLE, /"ok": true/);

const brief = buildCustomWebhookDeveloperBrief();
assert.match(brief, /rankboost\.test/);
assert.match(brief, /article\.ready/);
assert.match(brief, /verify X-RankBoost-Signature/);
assert.doesNotMatch(brief, /secretid|sk_live|Bearer [A-Za-z0-9]/i);

console.log("custom-webhook-contract.test.ts: ok");
