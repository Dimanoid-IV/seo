/**
 * Deterministic checks for autopilot execution eligibility.
 * Run with: npx tsx lib/autopilot/execution-eligibility.test.ts
 */
import assert from "node:assert/strict";

import { ArticleStatus, AutopilotMode, PlanPublishingMode } from "@prisma/client";

import {
  classifyDryRunOutcome,
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

  const pollutedReadyBrief = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      researchBrief: {
        id: "brief-polluted",
        websiteId: "website-1",
        organizationId: "org-1",
        source: "AUTOPILOT_PLAN",
        primaryKeyword: "На странице слишком мало текста для продвижения",
        secondaryKeywords: [],
        searchIntent: "INFORMATIONAL",
        buyerQuestion: "Question?",
        geoPrompts: [
          {
            prompt: "Test prompt",
            platform: "CHATGPT",
            desiredMentionAngle: "Angle",
          },
        ],
        competitors: [],
        contentGapSummary: "",
        recommendedArticleTitle: "На странице слишком мало текста для продвижения",
        outline: ["Intro"],
        faq: ["FAQ"],
        internalLinkSuggestions: ["/"],
        schemaSuggestions: [],
        evidence: [],
        qualityRequirements: [],
        riskLevel: "LOW",
        status: "READY_FOR_GENERATION",
        generatedAt: "2026-07-11T10:00:00.000Z",
      },
    }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
  });
  assert.equal(pollutedReadyBrief.action, "BLOCKED");
  assert.equal(pollutedReadyBrief.reasonKey, "researchBriefBlocked");

  const archivedLinked = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-archived",
      articleQualityPassed: false,
    }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
    article: {
      id: "article-archived",
      status: ArticleStatus.ARCHIVED,
      qualityPassed: false,
      websiteId,
      organizationId,
      wordpressPostId: null,
    },
  });
  assert.equal(archivedLinked.action, "BLOCKED");
  assert.equal(archivedLinked.reasonKey, "archivedArticleLinked");

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
  assert.equal(waitingReview.eligible, true);
  assert.equal(waitingReview.action, "PREPARE_PUBLISHING_HANDOFF");

  const publish = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-1",
      articleQualityPassed: true,
      pipelineState: "UNIVERSAL_PACKAGE_READY",
      universalPackagePreparedAt: "2026-07-11T12:00:00.000Z",
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
  // Handoff already complete → NOOP / executed
  assert.equal(publish.action, "NOOP_INTERNAL");

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
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
      websiteId,
      organizationId,
      wordpressPostId: null,
    },
  });
  assert.equal(blockedWp.action, "PREPARE_PUBLISHING_HANDOFF");
  assert.equal(blockedWp.summaryKey, "wouldPrepareUniversalPackage");

  const missingResearch = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({ researchBrief: undefined }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: false,
    websiteId,
    organizationId,
  });
  assert.equal(missingResearch.action, "PREPARE_RESEARCH_BRIEF");

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

  // Dry-run honesty: archived linked article is blocked, not "will run".
  assert.equal(classifyDryRunOutcome(archivedLinked), "blocked");

  // Failed-quality article skips (does not run).
  const failedQuality = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-failed",
      articleQualityPassed: false,
    }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
    article: {
      id: "article-failed",
      status: ArticleStatus.DRAFT,
      qualityPassed: false,
      websiteId,
      organizationId,
      wordpressPostId: null,
    },
  });
  assert.equal(failedQuality.action, "SKIP");
  assert.equal(failedQuality.reasonKey, "articleQualityFailed");
  assert.equal(classifyDryRunOutcome(failedQuality), "skipped");

  // TASK_FIX / SEO_FIX no-op must NOT be counted as an executed action in dry-run.
  assert.equal(classifyDryRunOutcome(seoFixNoop), "skipped");

  // A real preparable draft would run.
  assert.equal(classifyDryRunOutcome(prepare), "wouldRun");

  // A publishable article with incomplete handoff would run handoff.
  assert.equal(classifyDryRunOutcome(waitingReview), "wouldRun");

  // Custom site without WP prepares universal package — would run, not blocked.
  assert.equal(classifyDryRunOutcome(blockedWp), "wouldRun");

  // Already-created WordPress draft is a real state transition → wouldRun.
  const alreadyDraft = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-wp",
      articleQualityPassed: true,
      pipelineState: "WORDPRESS_DRAFT_CREATED",
      wordpressDraftCreatedAt: "2026-07-11T12:00:00.000Z",
    }),
    now,
    autopilotMode: AutopilotMode.APPROVED_PLAN_AUTOPILOT,
    wordpressConnected: true,
    websiteId,
    organizationId,
    article: {
      id: "article-wp",
      status: ArticleStatus.WORDPRESS_DRAFT_CREATED,
      qualityPassed: true,
      websiteId,
      organizationId,
      wordpressPostId: "wp-1",
    },
  });
  assert.equal(alreadyDraft.action, "NOOP_INTERNAL");
  assert.equal(alreadyDraft.suggestedStatus, "executed");
  assert.equal(classifyDryRunOutcome(alreadyDraft), "wouldRun");

  // Prompt 11.50: AUTO_PUBLISH skips per-article confirm after quality pass.
  const autoPublishHandoff = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-auto",
      articleQualityPassed: true,
    }),
    now,
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    wordpressConnected: true,
    websiteId,
    organizationId,
    article: {
      id: "article-auto",
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
      websiteId,
      organizationId,
      wordpressPostId: null,
    },
  });
  assert.equal(autoPublishHandoff.action, "PREPARE_PUBLISHING_HANDOFF");
  assert.equal(autoPublishHandoff.reasonKey, "readyForPublishingHandoff");

  const autoPublishCustomWebhook = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-custom-auto",
      articleQualityPassed: true,
      publishingPath: "webhook",
    }),
    now,
    autopilotMode: AutopilotMode.AUTOPUBLISH,
    wordpressConnected: false,
    webhookConfiguredAndTested: true,
    customWebhookAutoSendAllowed: true,
    planPublishingMode: PlanPublishingMode.AUTO_PUBLISH,
    websiteId,
    organizationId,
    article: {
      id: "article-custom-auto",
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
      websiteId,
      organizationId,
      wordpressPostId: null,
    },
  });
  assert.equal(autoPublishCustomWebhook.action, "PREPARE_PUBLISHING_HANDOFF");
  assert.equal(autoPublishCustomWebhook.summaryKey, "wouldSendWebhook");
  assert.equal(classifyDryRunOutcome(autoPublishCustomWebhook), "wouldRun");

  const autoPublishCustomWebhookNotAllowlisted =
    resolvePlanItemExecutionEligibility({
      item: baseArticleItem({
        status: "prepared",
        generatedArticleId: "article-custom-ready",
        articleQualityPassed: true,
        publishingPath: "webhook",
      }),
      now,
      autopilotMode: AutopilotMode.AUTOPUBLISH,
      wordpressConnected: false,
      webhookConfiguredAndTested: true,
      customWebhookAutoSendAllowed: false,
      planPublishingMode: PlanPublishingMode.AUTO_PUBLISH,
      websiteId,
      organizationId,
      article: {
        id: "article-custom-ready",
        status: ArticleStatus.WAITING_REVIEW,
        qualityPassed: true,
        websiteId,
        organizationId,
        wordpressPostId: null,
      },
    });
  assert.equal(
    autoPublishCustomWebhookNotAllowlisted.summaryKey,
    "wouldPrepareWebhookReady"
  );
  assert.equal(autoPublishCustomWebhookNotAllowlisted.suggestedStatus, "prepared");

  // Prepare-for-review (REVIEW_FIRST) waits for human before handoff.
  const reviewFirstWait = resolvePlanItemExecutionEligibility({
    item: baseArticleItem({
      status: "prepared",
      generatedArticleId: "article-review",
      articleQualityPassed: true,
    }),
    now,
    autopilotMode: AutopilotMode.REVIEW_FIRST,
    wordpressConnected: true,
    websiteId,
    organizationId,
    article: {
      id: "article-review",
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
      websiteId,
      organizationId,
      wordpressPostId: null,
    },
  });
  assert.equal(reviewFirstWait.action, "SKIP");
  assert.equal(reviewFirstWait.reasonKey, "waitingForReviewApproval");
}

if (require.main === module) {
  runExecutionEligibilityChecks();
  console.log("execution-eligibility checks passed");
}

export { runExecutionEligibilityChecks };
