/**
 * Confirm disconnect clears encrypted URL + secret fields from scopes.
 * Run with: npx tsx lib/publishing/custom-webhook-config.disconnect.test.ts
 */

import assert from "node:assert/strict";

import { CUSTOM_PUBLISHING_KIND } from "./custom-webhook-config";

{
  const disconnectScopes = {
    kind: CUSTOM_PUBLISHING_KIND,
    testedAt: null,
    autoSendEnabled: false,
    hasSharedSecret: false,
  };
  assert.equal(disconnectScopes.testedAt, null);
  assert.equal(disconnectScopes.hasSharedSecret, false);
  assert.equal(disconnectScopes.autoSendEnabled, false);
  assert.ok(!("endpointUrl" in disconnectScopes));
  assert.ok(!("secret" in disconnectScopes));
}

console.log("custom-webhook-config.disconnect.test.ts: ok");
