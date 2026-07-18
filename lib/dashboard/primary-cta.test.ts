import assert from "node:assert";

import {
  planHasApprovedArticleTopics,
  resolveDashboardPrimaryCta,
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

// 2) Ready review materials beat email/plan/GSC/publishing.
assert.deepEqual(
  resolveDashboardPrimaryCta({
    hasAudit: true,
    reviewQueueCount: 1,
    hasApprovedPlanWithArticleTopics: true,
    gscNeedsProperty: true,
    publishingConfigured: false,
  }),
  { kind: "OPEN_REVIEW", href: "/app/review" }
);

// 3) Approved plan with article topics when review is empty.
assert.deepEqual(
  resolveDashboardPrimaryCta({
    hasAudit: true,
    reviewQueueCount: 0,
    hasApprovedPlanWithArticleTopics: true,
    gscNeedsProperty: true,
    publishingConfigured: false,
  }),
  { kind: "OPEN_PLAN", href: "/app/autopilot" }
);

// 4) GSC property selection.
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

// 5) Publishing setup.
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

// 6) Fallback control center.
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
  planHasApprovedArticleTopics({
    monthlyPlanStatus: "approved",
    planItemTypes: ["TASK_FIX"],
  }),
  false
);
assert.equal(
  planHasApprovedArticleTopics({
    monthlyPlanStatus: "proposed",
    planItemTypes: ["ARTICLE"],
  }),
  false
);

console.log("dashboard primary-cta checks passed");
