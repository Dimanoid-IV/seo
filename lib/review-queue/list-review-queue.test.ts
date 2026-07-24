/**
 * Run with: npx tsx lib/review-queue/list-review-queue.test.ts
 */
import assert from "node:assert/strict";

import { resolveReviewArticlePublishPath } from "./list-review-queue";

assert.equal(
  resolveReviewArticlePublishPath({
    customPublishingConnected: true,
    autopilotPublishingPath: "universal_package",
  }),
  "webhook",
  "connected custom publishing must beat stale universal-package plan metadata"
);

assert.equal(
  resolveReviewArticlePublishPath({
    customPublishingConnected: true,
    autopilotPublishingPath: "webhook",
  }),
  "webhook"
);

assert.equal(
  resolveReviewArticlePublishPath({
    wordpressDraftCreated: true,
    customPublishingConnected: true,
    autopilotPublishingPath: "webhook",
  }),
  "wordpress_draft",
  "WordPress draft remains the most specific existing publish state"
);

assert.equal(
  resolveReviewArticlePublishPath({
    hasWordPressPostId: true,
    customPublishingConnected: true,
  }),
  "wordpress_draft"
);

assert.equal(
  resolveReviewArticlePublishPath({
    customPublishingConnected: false,
    autopilotPublishingPath: "webhook",
  }),
  "universal_package",
  "stale webhook metadata without a connected endpoint should fall back safely"
);

assert.equal(
  resolveReviewArticlePublishPath({
    customPublishingConnected: false,
  }),
  "universal_package"
);

console.log("list-review-queue.test.ts: ok");
