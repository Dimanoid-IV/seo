/**
 * Run with: npx tsx lib/publishing/custom-publishing-display.test.ts
 */

import assert from "node:assert/strict";

import {
  buildCustomPublishingDisplayState,
  resolveArticlePublishPriority,
} from "./custom-publishing-display";

{
  const disconnected = buildCustomPublishingDisplayState({});
  assert.equal(disconnected.connected, false);
  assert.equal(disconnected.connectedBanner, null);
}

{
  const connected = buildCustomPublishingDisplayState({
    endpointConfigured: true,
    endpointHost: "hooks.example.com",
    testedAt: "2026-07-19T00:00:00.000Z",
    hasSharedSecret: true,
  });
  assert.equal(connected.connected, true);
  assert.equal(connected.tested, true);
  assert.equal(connected.hostLabel, "hooks.example.com");
  assert.equal(connected.hasSharedSecret, true);
  assert.equal(connected.connectedBanner, "Подключено: hooks.example.com");
  // Never includes protocol/path/secret
  assert.ok(!connected.connectedBanner?.includes("https"));
  assert.ok(!connected.connectedBanner?.includes("/"));
}

{
  // Configured but not tested → not connected display
  const pending = buildCustomPublishingDisplayState({
    endpointConfigured: true,
    endpointHost: "example.com",
    testedAt: null,
  });
  assert.equal(pending.connected, false);
  assert.equal(pending.connectedBanner, null);
}

{
  assert.equal(
    resolveArticlePublishPriority({
      wordpressConnected: true,
      webhookTested: true,
    }),
    "wordpress_draft"
  );
  assert.equal(
    resolveArticlePublishPriority({
      wordpressConnected: false,
      webhookTested: true,
    }),
    "webhook"
  );
  assert.equal(
    resolveArticlePublishPriority({
      wordpressConnected: false,
      webhookTested: false,
    }),
    "universal_package"
  );
}

console.log("custom-publishing-display.test.ts: ok");
