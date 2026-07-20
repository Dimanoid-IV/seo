/**
 * Run with: npx tsx lib/review-queue/article-publish-action.test.ts
 */
import assert from "node:assert/strict";

import {
  canPublishArticleToCustomSiteFromReview,
  canPublishArticleToHostedPageFromReview,
} from "./article-publish-action";

assert.equal(
  canPublishArticleToCustomSiteFromReview({
    type: "ARTICLE_DRAFT",
    articleContext: {
      qualityScore: 100,
      qualityPassed: true,
      linkedAutopilotPlanItem: true,
      autopilotUnlockOnApprove: false,
      customPublishingConnected: true,
    },
  }),
  true
);

assert.equal(
  canPublishArticleToCustomSiteFromReview({
    type: "ARTICLE_DRAFT",
    articleContext: {
      qualityScore: 60,
      qualityPassed: false,
      linkedAutopilotPlanItem: true,
      autopilotUnlockOnApprove: false,
      customPublishingConnected: true,
    },
  }),
  false
);

assert.equal(
  canPublishArticleToCustomSiteFromReview({
    type: "ARTICLE_DRAFT",
    articleContext: {
      qualityScore: 100,
      qualityPassed: true,
      linkedAutopilotPlanItem: true,
      autopilotUnlockOnApprove: false,
      customPublishingConnected: false,
    },
  }),
  false
);

assert.equal(
  canPublishArticleToCustomSiteFromReview({
    type: "SEO_FIX",
    articleContext: undefined,
  }),
  false
);

assert.equal(
  canPublishArticleToHostedPageFromReview({
    type: "ARTICLE_DRAFT",
    articleContext: {
      qualityScore: 95,
      qualityPassed: true,
      linkedAutopilotPlanItem: true,
      autopilotUnlockOnApprove: false,
      customPublishingConnected: false,
    },
  }),
  true
);

assert.equal(
  canPublishArticleToHostedPageFromReview({
    type: "ARTICLE_DRAFT",
    articleContext: {
      qualityScore: 95,
      qualityPassed: true,
      linkedAutopilotPlanItem: true,
      autopilotUnlockOnApprove: false,
      customPublishingConnected: true,
    },
  }),
  false
);

assert.equal(
  canPublishArticleToHostedPageFromReview({
    type: "ARTICLE_DRAFT",
    articleContext: {
      qualityScore: 60,
      qualityPassed: false,
      linkedAutopilotPlanItem: true,
      autopilotUnlockOnApprove: false,
      customPublishingConnected: false,
    },
  }),
  false
);

console.log("article-publish-action.test.ts: ok");
