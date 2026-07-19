/**
 * Prompt 11.53 — emergency pause + WordPress rollback policy tests.
 * Run: npx tsx lib/integrations/adapters/wordpress/wordpress-emergency-controls.test.ts
 */

import assert from "node:assert/strict";
import {
  ArticleStatus,
  AutopilotMode,
  WordPressConnectionStatus,
} from "@prisma/client";

import {
  canLivePublishArticleViaWordPress,
} from "./can-live-publish";
import {
  canRollbackArticleViaWordPress,
  buildWordPressRollbackIdempotencyKey,
} from "./can-rollback";
import { isLivePublishKillSwitchEngaged } from "@/lib/integrations/live-publish-gate";
import { resolveExecutionJobActions } from "@/lib/integrations/execution-actions";
import { resolvePlanItemExecutionEligibility } from "@/lib/autopilot/execution-eligibility";
import type { AutopilotPlanItem } from "@/lib/autopilot/plan-item-types";

function baseArticle(
  overrides: Partial<{
    id: string;
    websiteId: string;
    organizationId: string;
    status: ArticleStatus;
    qualityPassed: boolean | null;
    wordpressPostId: string | null;
    contentHtml: string | null;
    publishedAt: Date | null;
  }> = {}
) {
  return {
    id: "art-1",
    websiteId: "web-1",
    organizationId: "org-1",
    status: ArticleStatus.WAITING_REVIEW,
    qualityPassed: true as boolean | null,
    wordpressPostId: null as string | null,
    contentHtml: "<p>hello</p>",
    publishedAt: null as Date | null,
    ...overrides,
  };
}

function planItem(
  overrides: Partial<AutopilotPlanItem> = {}
): AutopilotPlanItem {
  return {
    id: "item-1",
    type: "ARTICLE",
    title: "Test",
    reason: "test",
    riskLevel: "low",
    needsIntegration: true,
    integrationType: "wordpress",
    status: "approved",
    generatedArticleId: "art-1",
    ...overrides,
  };
}

// --- Global kill switch ---
{
  delete process.env.LIVE_PUBLISH_KILL_SWITCH;
  assert.equal(isLivePublishKillSwitchEngaged(), true);

  const blocked = canLivePublishArticleViaWordPress({
    article: baseArticle(),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    planItem: planItem(),
    planStatus: "APPROVED",
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    planPublishingMode: "AUTO_PUBLISH",
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    killSwitch: { engaged: true },
    websiteLivePublishPaused: false,
    monthlyQuotaOk: true,
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.blockedReason, "kill_switch_engaged");
}

// --- Per-website pause ---
{
  const paused = canLivePublishArticleViaWordPress({
    article: baseArticle(),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    planItem: planItem(),
    planStatus: "APPROVED",
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    planPublishingMode: "AUTO_PUBLISH",
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    killSwitch: { engaged: false },
    websiteLivePublishPaused: true,
    monthlyQuotaOk: true,
  });
  assert.equal(paused.allowed, false);
  assert.equal(paused.blockedReason, "website_paused");
}

// --- Resume allows gate when all else valid ---
{
  const ok = canLivePublishArticleViaWordPress({
    article: baseArticle(),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    planItem: planItem(),
    planStatus: "APPROVED",
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    planPublishingMode: "AUTO_PUBLISH",
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    killSwitch: { engaged: false },
    websiteLivePublishPaused: false,
    monthlyQuotaOk: true,
  });
  assert.equal(ok.allowed, true);
  assert.equal(ok.blockedReason, null);
}

// --- Rollback denied for non-RankBoost post ---
{
  const denied = canRollbackArticleViaWordPress({
    article: baseArticle({
      status: ArticleStatus.PUBLISHED,
      wordpressPostId: "99",
    }),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    rankBoostPublishJobExists: false,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.blockedReason, "not_rankboost_published");
}

// --- Rollback denied without WP connection ---
{
  const denied = canRollbackArticleViaWordPress({
    article: baseArticle({
      status: ArticleStatus.PUBLISHED,
      wordpressPostId: "99",
    }),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    wordpressConnection: null,
    rankBoostPublishJobExists: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.blockedReason, "wordpress_not_connected");
}

// --- Rollback allowed for RankBoost published ---
{
  const ok = canRollbackArticleViaWordPress({
    article: baseArticle({
      status: ArticleStatus.PUBLISHED,
      wordpressPostId: "7",
    }),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    rankBoostPublishJobExists: true,
  });
  assert.equal(ok.allowed, true);
  assert.equal(
    buildWordPressRollbackIdempotencyKey({
      articleId: "art-1",
      wordpressPostId: "7",
    }),
    "wordpress:rollback:article:art-1:post:7"
  );
}

// --- Rollback denied when not PUBLISHED ---
{
  const denied = canRollbackArticleViaWordPress({
    article: baseArticle({
      status: ArticleStatus.WAITING_REVIEW,
      wordpressPostId: "7",
    }),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    rankBoostPublishJobExists: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.blockedReason, "article_not_published");
}

// --- Tenant isolation ownership ---
{
  const denied = canRollbackArticleViaWordPress({
    article: baseArticle({
      status: ArticleStatus.PUBLISHED,
      wordpressPostId: "7",
      organizationId: "org-other",
    }),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    rankBoostPublishJobExists: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.blockedReason, "ownership_mismatch");
}

// --- Retry / rollback action availability ---
{
  const failedPublish = resolveExecutionJobActions({
    action: "PUBLISH",
    status: "FAILED",
    provider: "WORDPRESS",
    sourceType: "ARTICLE",
    sourceId: "art-1",
  });
  assert.equal(failedPublish.canRetry, true);
  assert.equal(failedPublish.canRollback, false);

  const succeededPublish = resolveExecutionJobActions({
    action: "PUBLISH",
    status: "SUCCEEDED",
    provider: "WORDPRESS",
    sourceType: "ARTICLE",
    sourceId: "art-1",
  });
  assert.equal(succeededPublish.canRetry, false);
  assert.equal(succeededPublish.canRollback, true);

  const seo = resolveExecutionJobActions({
    action: "APPLY_SEO_FIX",
    status: "SUCCEEDED",
    provider: "WORDPRESS",
    sourceType: "TASK",
    sourceId: "task-1",
  });
  assert.equal(seo.canRollback, false);
}

// --- SEO_FIX still cannot live publish ---
{
  const eligibility = resolvePlanItemExecutionEligibility({
    item: planItem({ type: "SEO_FIX" }),
    websiteId: "web-1",
    organizationId: "org-1",
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    planPublishingMode: "AUTO_PUBLISH",
    wordpressConnected: true,
    now: new Date(),
    article: baseArticle({ status: ArticleStatus.APPROVED }),
  });
  assert.notEqual(eligibility.action, "LIVE_PUBLISH_ARTICLE");
}

// --- Already published blocks duplicate live publish ---
{
  const blocked = canLivePublishArticleViaWordPress({
    article: baseArticle({
      status: ArticleStatus.PUBLISHED,
      wordpressPostId: "7",
      publishedAt: new Date(),
    }),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    planItem: planItem(),
    planStatus: "APPROVED",
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    planPublishingMode: "AUTO_PUBLISH",
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    killSwitch: { engaged: false },
    websiteLivePublishPaused: false,
    monthlyQuotaOk: true,
  });
  assert.equal(blocked.allowed, false);
  assert.ok(
    blocked.blockedReason === "already_published_by_rankboost" ||
      blocked.blockedReason === "article_status_not_publishable"
  );
}

console.log("wordpress-emergency-controls.test.ts: ok");
