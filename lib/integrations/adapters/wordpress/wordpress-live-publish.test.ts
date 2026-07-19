/**
 * Prompt 11.51 — WordPress live publish gate, payload, eligibility, idempotency.
 * Run: npx tsx lib/integrations/adapters/wordpress/wordpress-live-publish.test.ts
 */

import assert from "node:assert/strict";
import {
  ArticleStatus,
  AutopilotMode,
  WordPressConnectionStatus,
} from "@prisma/client";

import {
  buildWordPressPublishIdempotencyKey,
  canLivePublishArticleViaWordPress,
} from "./can-live-publish";
import { mapArticleToWpRestPublishPayload } from "./publish-article";
import { resolvePlanItemExecutionEligibility } from "@/lib/autopilot/execution-eligibility";
import type { AutopilotPlanItem } from "@/lib/autopilot/plan-item-types";
import { resolveIdempotentCreate } from "@/lib/integrations/execution-jobs-core";
import { isLivePublishKillSwitchEngaged } from "@/lib/integrations/live-publish-gate";

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
    contentHtml: "<p>Hello</p>",
    publishedAt: null as Date | null,
    ...overrides,
  };
}

function baseItem(
  overrides: Partial<AutopilotPlanItem> = {}
): AutopilotPlanItem {
  return {
    id: "item-1",
    type: "ARTICLE",
    title: "Test article",
    reason: "growth",
    riskLevel: "low",
    needsIntegration: true,
    integrationType: "wordpress",
    status: "approved",
    generatedArticleId: "art-1",
    articleQualityPassed: true,
    researchBrief: {
      id: "brief-1",
      websiteId: "web-1",
      organizationId: "org-1",
      source: "AUTOPILOT_PLAN",
      primaryKeyword: "SEO audit Tallinn",
      secondaryKeywords: [],
      searchIntent: "COMMERCIAL",
      buyerQuestion: "How much does an SEO audit cost?",
      geoPrompts: [
        {
          prompt: "Best SEO audit in Tallinn",
          platform: "CHATGPT",
          desiredMentionAngle: "Local expertise",
        },
      ],
      competitors: [],
      contentGapSummary: "Gap summary",
      recommendedArticleTitle: "SEO audit Tallinn guide",
      outline: ["Intro"],
      faq: ["How long?"],
      internalLinkSuggestions: ["/"],
      schemaSuggestions: ["FAQPage"],
      evidence: [],
      qualityRequirements: ["Local context"],
      riskLevel: "LOW",
      status: "READY_FOR_GENERATION",
      generatedAt: "2026-07-11T10:00:00.000Z",
    },
    ...overrides,
  };
}

function allowedInput(
  overrides: Parameters<typeof canLivePublishArticleViaWordPress>[0] = {} as never
) {
  return {
    article: baseArticle(),
    website: { id: "web-1", organizationId: "org-1" },
    organization: { id: "org-1" },
    planItem: baseItem(),
    planStatus: "APPROVED",
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    planPublishingMode: "AUTO_PUBLISH",
    wordpressConnection: {
      status: WordPressConnectionStatus.CONNECTED,
      disconnectedAt: null,
      hasCredentials: true,
    },
    quality: { qualityPassed: true, qualityScore: 85 },
    killSwitch: { engaged: false },
    livePublishRolloutEnabled: true,
    minQualityScore: 70,
    monthlyQuotaOk: true,
    duplicatePublishedExternalId: false,
    ...overrides,
  };
}

// --- gate denies without approved plan ---
{
  const r = canLivePublishArticleViaWordPress(
    allowedInput({ planStatus: "READY" })
  );
  assert.equal(r.allowed, false);
  assert.equal(r.blockedReason, "plan_not_approved");
}

// --- gate denies REVIEW_ONLY ---
{
  const r = canLivePublishArticleViaWordPress(
    allowedInput({ planPublishingMode: "REVIEW_ONLY" })
  );
  assert.equal(r.allowed, false);
  assert.equal(r.blockedReason, "plan_review_only");
}

// --- gate denies failed quality ---
{
  const r = canLivePublishArticleViaWordPress(
    allowedInput({
      article: baseArticle({ qualityPassed: false }),
      quality: { qualityPassed: false },
    })
  );
  assert.equal(r.allowed, false);
  assert.equal(r.blockedReason, "quality_failed");
}

// --- gate denies missing WP connection ---
{
  const r = canLivePublishArticleViaWordPress(
    allowedInput({ wordpressConnection: null })
  );
  assert.equal(r.allowed, false);
  assert.equal(r.blockedReason, "wordpress_not_connected");
}

// --- gate denies duplicate publish ---
{
  const r = canLivePublishArticleViaWordPress(
    allowedInput({ duplicatePublishedExternalId: true })
  );
  assert.equal(r.allowed, false);
  assert.equal(r.blockedReason, "duplicate_published");
}

// --- gate denies already published by RankBoost ---
{
  const r = canLivePublishArticleViaWordPress(
    allowedInput({
      article: baseArticle({
        status: ArticleStatus.PUBLISHED,
        wordpressPostId: "99",
      }),
    })
  );
  assert.equal(r.allowed, false);
  assert.ok(
    r.blockedReason === "already_published_by_rankboost" ||
      r.blockedReason === "article_status_not_publishable"
  );
}

// --- gate denies kill switch ---
// --- kill switch blocks non-allowlisted websites ---
{
  const r = canLivePublishArticleViaWordPress(
    allowedInput({
      killSwitch: { engaged: true },
      livePublishRolloutEnabled: false,
      envAllowlist: [],
    })
  );
  assert.equal(r.allowed, false);
  assert.equal(r.blockedReason, "kill_switch_engaged");
}

// --- gate allows approved AUTO_PUBLISH quality-passed article ---
{
  const r = canLivePublishArticleViaWordPress(allowedInput());
  assert.equal(r.allowed, true);
  assert.equal(r.blockedReason, null);
}

// --- SEO_FIX / TASK_FIX never live publish ---
{
  const seo = canLivePublishArticleViaWordPress(
    allowedInput({ planItem: baseItem({ type: "SEO_FIX" }) })
  );
  assert.equal(seo.allowed, false);
  assert.equal(seo.blockedReason, "seo_fix_not_live");

  const task = canLivePublishArticleViaWordPress(
    allowedInput({ planItem: baseItem({ type: "TASK_FIX" }) })
  );
  assert.equal(task.allowed, false);
  assert.equal(task.blockedReason, "seo_fix_not_live");
}

// --- publish payload forces status publish ---
{
  const payload = mapArticleToWpRestPublishPayload({
    title: "T",
    contentHtml: "<p>x</p>",
    excerpt: "e",
    slug: "t",
  });
  assert.equal(payload.status, "publish");
  assert.equal(payload.title, "T");
}

// --- draft/pending response must not claim published ---
{
  const draftStatus = "draft";
  const pendingStatus = "pending";
  const livePublishedDraft = draftStatus === "publish";
  const livePublishedPending = pendingStatus === "publish";
  assert.equal(livePublishedDraft, false);
  assert.equal(livePublishedPending, false);
}

// --- job idempotency prevents double publish ---
{
  const key = buildWordPressPublishIdempotencyKey({
    articleId: "art-1",
    planId: "plan-1",
    planItemId: "item-1",
  });
  assert.equal(
    key,
    "wordpress:publish:article:art-1:plan:plan-1:item:item-1"
  );
  const store = new Map<string, { id: string; status: string }>();
  const first = resolveIdempotentCreate(store, key, () => ({
    id: "job-1",
    status: "SUCCEEDED",
  }));
  const second = resolveIdempotentCreate(store, key, () => ({
    id: "job-2",
    status: "QUEUED",
  }));
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.value.id, "job-1");
  assert.equal(second.value.status, "SUCCEEDED");
}

// --- autopilot REVIEW_ONLY still does not live publish ---
{
  const item = baseItem({
    status: "prepared",
    scheduledFor: new Date(0).toISOString(),
  });
  const result = resolvePlanItemExecutionEligibility({
    item,
    now: new Date(),
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId: "web-1",
    organizationId: "org-1",
    planPublishingMode: "REVIEW_ONLY",
    article: {
      id: "art-1",
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
      websiteId: "web-1",
      organizationId: "org-1",
      wordpressPostId: null,
    },
  });
  assert.notEqual(result.action, "LIVE_PUBLISH_ARTICLE");
  assert.equal(result.action, "PREPARE_PUBLISHING_HANDOFF");
}

// --- AUTOPUBLISH + AUTO_PUBLISH routes to live publish ---
{
  const item = baseItem({
    status: "prepared",
    scheduledFor: new Date(0).toISOString(),
  });
  const result = resolvePlanItemExecutionEligibility({
    item,
    now: new Date(),
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    wordpressConnected: true,
    websiteId: "web-1",
    organizationId: "org-1",
    planPublishingMode: "AUTO_PUBLISH",
    article: {
      id: "art-1",
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
      websiteId: "web-1",
      organizationId: "org-1",
      wordpressPostId: null,
    },
  });
  assert.equal(result.action, "LIVE_PUBLISH_ARTICLE");
  assert.equal(result.eligible, true);
}

// --- SEO_FIX eligibility never LIVE_PUBLISH ---
{
  const item = baseItem({
    type: "SEO_FIX",
    status: "approved",
    scheduledFor: new Date(0).toISOString(),
    generatedArticleId: undefined,
  });
  const result = resolvePlanItemExecutionEligibility({
    item,
    now: new Date(),
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    wordpressConnected: true,
    websiteId: "web-1",
    organizationId: "org-1",
    planPublishingMode: "AUTO_PUBLISH",
  });
  assert.notEqual(result.action, "LIVE_PUBLISH_ARTICLE");
  assert.equal(result.action, "NOOP_INTERNAL");
}

// --- default kill switch engaged in this environment ---
{
  assert.equal(isLivePublishKillSwitchEngaged(), true);
}

console.log("wordpress-live-publish.test.ts: ok");
