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
    researchBrief: { version: 1 },
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
