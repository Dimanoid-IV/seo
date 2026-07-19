/**
 * Prompt 11.55 — scoped first-customer live publish rollout tests.
 * Run: npx tsx lib/integrations/live-publish-rollout.test.ts
 */

import assert from "node:assert/strict";
import {
  ArticleStatus,
  AutopilotMode,
  WordPressConnectionStatus,
} from "@prisma/client";

import {
  isWebsiteOnLivePublishAllowlist,
  parseLivePublishAllowedWebsiteIds,
  resolveLivePublishScope,
  getLivePublishMinQualityScore,
  getLivePublishMaxPerDay,
  getLivePublishFirstRolloutMaxArticles,
} from "./live-publish-rollout";
import { canLivePublishArticleViaWordPress } from "./adapters/wordpress/can-live-publish";
import { resolvePlanItemExecutionEligibility } from "@/lib/autopilot/execution-eligibility";
import type { AutopilotPlanItem } from "@/lib/autopilot/plan-item-types";
import { canRollbackArticleViaWordPress } from "./adapters/wordpress/can-rollback";

const WEB_A = "11111111-1111-4111-8111-111111111111";
const WEB_B = "22222222-2222-4222-8222-222222222222";

function baseGate(overrides: Record<string, unknown> = {}) {
  return canLivePublishArticleViaWordPress({
    article: {
      id: "art-1",
      websiteId: WEB_A,
      organizationId: "org-1",
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
      qualityScore: 85,
      wordpressPostId: null,
      contentHtml: "<p>ok</p>",
    },
    website: { id: WEB_A, organizationId: "org-1" },
    organization: { id: "org-1" },
    planItem: {
      id: "item-1",
      type: "ARTICLE",
      status: "approved",
      generatedArticleId: "art-1",
    } as Pick<
      AutopilotPlanItem,
      "id" | "type" | "status" | "generatedArticleId"
    >,
    planStatus: "APPROVED",
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    planPublishingMode: "AUTO_PUBLISH",
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    killSwitch: { engaged: true },
    livePublishRolloutEnabled: false,
    envAllowlist: [],
    websiteLivePublishPaused: false,
    minQualityScore: 70,
    maxPublishPerDay: 1,
    firstRolloutMaxArticles: 1,
    succeededPublishCountToday: 0,
    succeededPublishCountTotal: 0,
    monthlyQuotaOk: true,
    ...overrides,
  });
}

// --- parse allowlist ---
{
  assert.deepEqual(
    parseLivePublishAllowedWebsiteIds(`${WEB_A}, ${WEB_B}`),
    [WEB_A, WEB_B]
  );
  assert.equal(parseLivePublishAllowedWebsiteIds("").length, 0);
  assert.equal(isWebsiteOnLivePublishAllowlist(WEB_A, { envAllowlist: [WEB_A] }), true);
  assert.equal(isWebsiteOnLivePublishAllowlist(WEB_B, { envAllowlist: [WEB_A] }), false);
  assert.equal(
    isWebsiteOnLivePublishAllowlist(WEB_B, {
      envAllowlist: [],
      dbRolloutEnabled: true,
    }),
    true
  );
}

// --- allowlist blocks non-allowed when kill switch engaged ---
{
  const blocked = baseGate({ envAllowlist: [WEB_A], website: { id: WEB_B, organizationId: "org-1" }, article: {
    id: "art-1",
    websiteId: WEB_B,
    organizationId: "org-1",
    status: ArticleStatus.WAITING_REVIEW,
    qualityPassed: true,
    qualityScore: 85,
    wordpressPostId: null,
    contentHtml: "<p>ok</p>",
  }});
  // WEB_B not on allowlist, kill engaged → kill_switch_engaged
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.blockedReason, "kill_switch_engaged");
}

// --- allowlisted website passes even with kill switch engaged ---
{
  const ok = baseGate({
    envAllowlist: [WEB_A],
    killSwitch: { engaged: true },
  });
  assert.equal(ok.allowed, true);
  assert.equal(ok.blockedReason, null);

  const scope = resolveLivePublishScope({
    websiteId: WEB_A,
    killSwitchEngaged: true,
    envAllowlist: [WEB_A],
  });
  assert.equal(scope.allowed, true);
  assert.equal(scope.scopedKillSwitchBypass, true);
}

// --- DB rollout flag allowlists ---
{
  const ok = baseGate({
    envAllowlist: [],
    livePublishRolloutEnabled: true,
    killSwitch: { engaged: true },
  });
  assert.equal(ok.allowed, true);
}

// --- pause overrides allowlist ---
{
  const paused = baseGate({
    envAllowlist: [WEB_A],
    killSwitch: { engaged: true },
    websiteLivePublishPaused: true,
  });
  assert.equal(paused.allowed, false);
  assert.equal(paused.blockedReason, "website_paused");
}

// --- first rollout max enforced ---
{
  const limited = baseGate({
    envAllowlist: [WEB_A],
    killSwitch: { engaged: true },
    firstRolloutMaxArticles: 1,
    succeededPublishCountTotal: 1,
  });
  assert.equal(limited.allowed, false);
  assert.equal(limited.blockedReason, "first_rollout_limit_exceeded");
}

// --- daily limit enforced ---
{
  const limited = baseGate({
    envAllowlist: [WEB_A],
    killSwitch: { engaged: true },
    maxPublishPerDay: 1,
    succeededPublishCountToday: 1,
    succeededPublishCountTotal: 0,
  });
  assert.equal(limited.allowed, false);
  assert.equal(limited.blockedReason, "daily_limit_exceeded");
}

// --- quality score threshold ---
{
  const low = baseGate({
    envAllowlist: [WEB_A],
    killSwitch: { engaged: true },
    minQualityScore: 80,
    quality: { qualityPassed: true, qualityScore: 50 },
    article: {
      id: "art-1",
      websiteId: WEB_A,
      organizationId: "org-1",
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
      qualityScore: 50,
      wordpressPostId: null,
      contentHtml: "<p>ok</p>",
    },
  });
  assert.equal(low.allowed, false);
  assert.equal(low.blockedReason, "quality_score_too_low");
}

// --- kill cleared but not allowlisted → website_not_allowlisted ---
{
  delete process.env.LIVE_PUBLISH_OPEN_TO_ALL;
  const blocked = baseGate({
    envAllowlist: [],
    livePublishRolloutEnabled: false,
    killSwitch: { engaged: false },
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.blockedReason, "website_not_allowlisted");
}

// --- SEO_FIX cannot pass live publish gate ---
{
  const seo = baseGate({
    envAllowlist: [WEB_A],
    killSwitch: { engaged: true },
    planItem: {
      id: "seo-1",
      type: "SEO_FIX",
      status: "approved",
      generatedArticleId: null,
    } as Pick<
      AutopilotPlanItem,
      "id" | "type" | "status" | "generatedArticleId"
    >,
  });
  assert.equal(seo.allowed, false);
  assert.equal(seo.blockedReason, "seo_fix_not_live");
}

// --- SEO_FIX still cannot live publish via eligibility ---
{
  const eligibility = resolvePlanItemExecutionEligibility({
    item: {
      id: "seo-1",
      type: "SEO_FIX",
      title: "Fix",
      reason: "x",
      riskLevel: "low",
      needsIntegration: false,
      integrationType: "none",
      status: "approved",
      scheduledFor: new Date(0).toISOString(),
    },
    now: new Date(),
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    wordpressConnected: true,
    websiteId: WEB_A,
    organizationId: "org-1",
    planPublishingMode: "AUTO_PUBLISH",
  });
  assert.notEqual(eligibility.action, "LIVE_PUBLISH_ARTICLE");
}

// --- rollback remains available for RankBoost published ---
{
  const ok = canRollbackArticleViaWordPress({
    article: {
      id: "art-1",
      websiteId: WEB_A,
      organizationId: "org-1",
      status: ArticleStatus.PUBLISHED,
      wordpressPostId: "9",
    },
    website: { id: WEB_A, organizationId: "org-1" },
    organization: { id: "org-1" },
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      hasCredentials: true,
    },
    rankBoostPublishJobExists: true,
  });
  assert.equal(ok.allowed, true);
}

assert.equal(getLivePublishMinQualityScore() >= 1, true);
assert.equal(getLivePublishMaxPerDay() >= 1, true);
assert.equal(getLivePublishFirstRolloutMaxArticles() >= 1, true);

console.log("live-publish-rollout.test.ts: ok");
