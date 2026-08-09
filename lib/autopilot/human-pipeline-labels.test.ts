import assert from "node:assert/strict";

import {
  pipelineStateToLabelKey,
  publishingPathChip,
} from "./human-pipeline-labels";

assert.equal(pipelineStateToLabelKey("RESEARCH_READY"), "researchReady");
assert.equal(pipelineStateToLabelKey("DRAFT_GENERATING"), "draftGenerating");
assert.equal(
  pipelineStateToLabelKey("DRAFT_READY_FOR_REVIEW"),
  "draftReadyForReview"
);
assert.equal(
  pipelineStateToLabelKey("QUALITY_FAILED_NEEDS_REPAIR"),
  "qualityNeedsRepair"
);
assert.equal(
  pipelineStateToLabelKey("UNIVERSAL_PACKAGE_READY"),
  "universalPackageReady"
);
assert.equal(
  pipelineStateToLabelKey("WORDPRESS_DRAFT_CREATED"),
  "wordpressDraftCreated"
);
assert.equal(pipelineStateToLabelKey("WEBFLOW_ITEM_CREATED"), "webflowItemCreated");
assert.equal(
  pipelineStateToLabelKey("SHOPIFY_ARTICLE_CREATED"),
  "shopifyArticleCreated"
);
assert.equal(pipelineStateToLabelKey("WIX_DRAFT_CREATED"), "wixDraftCreated");
assert.equal(pipelineStateToLabelKey("GHOST_POST_CREATED"), "ghostPostCreated");
assert.equal(pipelineStateToLabelKey("GITHUB_PR_CREATED"), "githubPrCreated");
assert.equal(
  pipelineStateToLabelKey("SQUARESPACE_PACKAGE_READY"),
  "squarespacePackageReady"
);
assert.equal(
  pipelineStateToLabelKey("HOSTED_BLOG_PUBLISHED"),
  "hostedBlogPublished"
);
assert.equal(pipelineStateToLabelKey("WEBHOOK_READY"), "webhookReady");
assert.equal(pipelineStateToLabelKey("UNKNOWN"), null);

assert.equal(publishingPathChip("wordpress_draft"), "wordpress_draft");
assert.equal(publishingPathChip("webhook"), "webhook_ready");
assert.equal(publishingPathChip("webflow"), "connected_platform");
assert.equal(publishingPathChip("github_pr"), "connected_platform");
assert.equal(publishingPathChip("universal_package"), "manual");

console.log("human-pipeline-labels checks passed");
