import assert from "node:assert/strict";

import {
  resolveAutopilotPublishingTarget,
  type AutopilotPublishingConnections,
} from "./autopilot-publisher-router";

const none: AutopilotPublishingConnections = {
  wordpressConnected: false,
  webflowConnected: false,
  shopifyConnected: false,
  wixConnected: false,
  ghostConnected: false,
  customWebhookReady: false,
  githubPrConnected: false,
  squarespaceConnected: false,
  hostedBlogAvailable: false,
};

assert.equal(
  resolveAutopilotPublishingTarget({
    connections: { ...none, wordpressConnected: true, webflowConnected: true },
  }).path,
  "wordpress_draft"
);

assert.equal(
  resolveAutopilotPublishingTarget({
    connections: { ...none, webflowConnected: true, shopifyConnected: true },
  }).path,
  "webflow"
);

assert.equal(
  resolveAutopilotPublishingTarget({
    connections: { ...none, webflowConnected: true, shopifyConnected: true },
    preferredPath: "shopify",
  }).path,
  "shopify"
);

assert.equal(
  resolveAutopilotPublishingTarget({
    connections: { ...none, customWebhookReady: true, githubPrConnected: true },
  }).path,
  "webhook"
);

assert.equal(
  resolveAutopilotPublishingTarget({
    connections: { ...none, githubPrConnected: true, squarespaceConnected: true },
  }).path,
  "github_pr"
);

assert.equal(
  resolveAutopilotPublishingTarget({
    connections: { ...none, squarespaceConnected: true, hostedBlogAvailable: true },
  }).path,
  "squarespace"
);

assert.equal(
  resolveAutopilotPublishingTarget({
    connections: { ...none, hostedBlogAvailable: true },
  }).path,
  "hosted_blog"
);

assert.equal(
  resolveAutopilotPublishingTarget({ connections: none }).path,
  "universal_package"
);

console.log("autopilot-publisher-router checks passed");

