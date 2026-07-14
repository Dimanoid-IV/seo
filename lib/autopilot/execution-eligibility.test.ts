/**
 * Deterministic checks for autopilot execution eligibility.
 * Run with: npx tsx lib/autopilot/execution-eligibility.test.ts
 */
import assert from "node:assert/strict";

import { ArticleStatus, AutopilotMode } from "@prisma/client";

import {
  findDuePlanItems,
  isPlanItemDueNow,
  resolvePlanItemExecutionEligibility,
} from "./execution-eligibility";
import type { AutopilotPlanItem } from "./plan-item-types";

function baseArticleItem(
  overrides: Partial<AutopilotPlanItem> = {}
): AutopilotPlanItem {
  return {
    id: "item-1",
    type: "ARTICLE",
    title: "Test article",
    reason: "Grow traffic",
    riskLevel: "low",
    needsIntegration: true,
    integrationType: "wordpress",
    status: "scheduled",
    scheduledFor: "2026-07-11T11:00:00.000Z",
    researchBrief: {
      id: "brief-1",
      websiteId: "website-1",
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

function runExecutionEligibilityChecks(): void {
  const now = new Date("2026-07-11T12:00:00.000Z");
  const websiteId = "website-1";
  const organizationId = "org-1";

  const skipped = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({ status: "skipped" }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
  });
  assert.equal(skipped.action, "SKIP");
  assert.equal(skipped.reasonKey, "terminalStatus");

  const prepare = resolvePlanItemExecutionEligibility({
    item: baseArticleItem(),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
  });
  assert.equal(prepare.eligible, true);
  assert.equal(prepare.action, "PREPARE_ARTICLE_DRAFT");

  const blockedBrief = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      researchBrief: {
        id: "brief-blocked",
        websiteId: "website-1",
        organizationId: "org-1",
        source: "AUTOPILOT_PLAN",
        primaryKeyword: "",
        secondaryKeywords: [],
        searchIntent: "INFORMATIONAL",
        buyerQuestion: "",
        geoPrompts: [],
        competitors: [],
        contentGapSummary: "",
        recommendedArticleTitle: "",
        outline: [],
        faq: [],
        internalLinkSuggestions: [],
        schemaSuggestions: [],
        evidence: [],
        qualityRequirements: [],
        riskLevel: "LOW",
        status: "BLOCKED",
        blockedReason: "Need keyword or content opportunity",
        generatedAt: "2026-07-11T10:00:00.000Z",
      },
    }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
  });
  assert.equal(blockedBrief.eligible, false);
  assert.equal(blockedBrief.action, "BLOCKED");
  assert.equal(blockedBrief.reasonKey, "researchBriefBlocked");

  const seoFixNoop = resolvePlanItemExecutionEligibility({
    item: {
      ...baseArticleItem(),
      id: "fix-1",
      type: "SEO_FIX",
      title: "Expand thin page content",
      needsIntegration: false,
      integrationType: "manual",
    },
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
  });
  assert.equal(seoFixNoop.eligible, true);
  assert.equal(seoFixNoop.action, "NOOP_INTERNAL");
  assert.equal(seoFixNoop.reasonKey, "nonArticleNoop");

  const waitingReview = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-1",
      articleQualityPassed: true,
    }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
    article: {
      id: "article-1",
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
      websiteId,
      organizationId,
      wordpressPostId: null,
    },
  });
  assert.equal(waitingReview.eligible, false);
  assert.equal(waitingReview.reasonKey, "waitingForReviewApproval");

  const publish = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-1",
      articleQualityPassed: true,
    }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
    article: {
      id: "article-1",
      status: ArticleStatus.APPROVED,
      qualityPassed: true,
      websiteId,
      organizationId,
      wordpressPostId: null,
    },
  });
  assert.equal(publish.eligible, true);
  assert.equal(publish.action, "PUBLISH_APPROVED_ARTICLE");

  const blockedWp = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-1",
      articleQualityPassed: true,
    }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: false,
    websiteId,
    organizationId,
    article: {
      id: "article-1",
      status: ArticleStatus.APPROVED,
      qualityPassed: true,
      websiteId,
      organizationId,
      wordpressPostId: null,
    },
  });
  assert.equal(blockedWp.action, "BLOCKED");
  assert.equal(blockedWp.reasonKey, "wordpressNotConnected");

  const dueItems = findDuePlanItems(
    [
      baseArticleItem(),
      baseArticleItem({
        id: "future",
        scheduledFor: "2026-07-15T10:00:00.000Z",
      }),
    ],
    now
  );
  assert.equal(dueItems.length, 1);
  assert.equal(isPlanItemDueNow(baseArticleItem(), now), true);
}

if (require.main === module) {
  runExecutionEligibilityChecks();
  console.log("execution-eligibility checks passed");
}

export { runExecutionEligibilityChecks };
