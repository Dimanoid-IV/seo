/**
 * Run with: npx tsx lib/publishing/custom-webhook.test.ts
 */

import assert from "node:assert/strict";

import { signWebhookPayload, verifyWebhookSignature } from "./signature";
import { isWebhookReadyForAutoSend } from "./custom-webhook-config";

{
  const body = '{"event":"article.ready"}';
  const sig = signWebhookPayload(body, "s3cret");
  assert.ok(verifyWebhookSignature(body, "s3cret", sig));
  assert.equal(verifyWebhookSignature(body, "s3cret", null), false);
}

{
  assert.equal(
    isWebhookReadyForAutoSend({
      integrationId: "x",
      endpointConfigured: true,
      endpointHost: "example.com",
      testedAt: new Date().toISOString(),
      autoSendEnabled: false,
      hasSharedSecret: true,
    }),
    false
  );
  assert.equal(
    isWebhookReadyForAutoSend({
      integrationId: "x",
      endpointConfigured: true,
      endpointHost: "example.com",
      testedAt: new Date().toISOString(),
      autoSendEnabled: true,
      hasSharedSecret: false,
    }),
    true
  );
  assert.equal(isWebhookReadyForAutoSend(null), false);
}

console.log("custom-webhook.test.ts: ok");
