import assert from "node:assert";

import {
  findNextScheduledArticleAt,
  planHasApprovedArticleTopics,
  resolveDashboardPrimaryCta,
  resolveDashboardPublishingState,
} from "./primary-cta";

// 1) No audit wins over everything else.
assert.equal(
  resolveDashboardPrimaryCta({
    hasAudit: false,
    reviewQueueCount: 3,
    hasApprovedPlanWithArticleTopics: true,
    gscNeedsProperty: true,
    publishingConfigured: false,
  }).kind,
  "RUN_AUDIT"
);

// 2) Pending plan confirmation.
assert.deepEqual(
  resolveDashboardPrimaryCta({
    hasAudit: true,
    reviewQueueCount: 0,
    hasPendingPlanApproval: true,
    hasApprovedPlanWithArticleTopics: false,
    gscNeedsProperty: false,
    publishingConfigured: true,
  }),
  { kind: "CONFIRM_MONTHLY_PLAN", href: "/app/autopilot" }
);

// 3) Ready review materials beat plan/GSC/publishing.
assert.equal(
  resolveDashboardPrimaryCta({
    hasAudit: true,
    reviewQueueCount: 1,
    hasApprovedPlanWithArticleTopics: true,
    gscNeedsProperty: true,
    publishingConfigured: false,
  }).kind,
  "OPEN_REVIEW"
);

// 4) Approved plan active when review is empty.
assert.equal(
  resolveDashboardPrimaryCta({
    hasAudit: true,
    reviewQueueCount: 0,
    hasApprovedPlanWithArticleTopics: true,
    gscNeedsProperty: true,
    publishingConfigured: false,
    nextScheduledArticleAt: "2026-07-20T09:00:00.000Z",
  }).kind,
  "AUTOPILOT_ACTIVE"
);

// 5) GSC property selection.
assert.deepEqual(
  resolveDashboardPrimaryCta({
    hasAudit: true,
    reviewQueueCount: 0,
    hasApprovedPlanWithArticleTopics: false,
    gscNeedsProperty: true,
    publishingConfigured: false,
  }),
  { kind: "SELECT_GSC", href: "/app/integrations" }
);

// 6) Publishing setup.
assert.deepEqual(
  resolveDashboardPrimaryCta({
    hasAudit: true,
    reviewQueueCount: 0,
    hasApprovedPlanWithArticleTopics: false,
    gscNeedsProperty: false,
    publishingConfigured: false,
  }),
  { kind: "SETUP_PUBLISHING", href: "/app/integrations" }
);

// 7) Fallback control center.
assert.deepEqual(
  resolveDashboardPrimaryCta({
    hasAudit: true,
    reviewQueueCount: 0,
    hasApprovedPlanWithArticleTopics: false,
    gscNeedsProperty: false,
    publishingConfigured: true,
  }),
  { kind: "OPEN_CONTROL_CENTER", href: "/app/autopilot-control" }
);

assert.equal(
  planHasApprovedArticleTopics({
    monthlyPlanStatus: "approved",
    planItemTypes: ["TASK_FIX", "ARTICLE"],
  }),
  true
);

assert.equal(
  findNextScheduledArticleAt(
    [
      { type: "ARTICLE", scheduledFor: "2026-07-10T09:00:00.000Z", status: "scheduled" },
      { type: "ARTICLE", scheduledFor: "2026-07-22T09:00:00.000Z", status: "scheduled" },
    ],
    new Date("2026-07-15T12:00:00.000Z")
  ),
  "2026-07-22T09:00:00.000Z"
);

assert.deepEqual(
  resolveDashboardPublishingState([
    { key: "wordpress", status: "MISSING" },
    { key: "custom_publishing", status: "CONNECTED" },
  ]),
  { configured: true, publishPath: "webhook" }
);

assert.deepEqual(
  resolveDashboardPublishingState([
    { key: "wordpress", status: "CONNECTED" },
    { key: "custom_publishing", status: "CONNECTED" },
  ]),
  { configured: true, publishPath: "wordpress_draft" }
);

assert.deepEqual(resolveDashboardPublishingState([]), {
  configured: false,
  publishPath: "universal_package",
});

console.log("dashboard primary-cta checks passed");
