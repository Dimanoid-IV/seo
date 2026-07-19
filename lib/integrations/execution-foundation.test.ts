/**
 * Run with: npx tsx lib/integrations/execution-foundation.test.ts
 */

import assert from "node:assert/strict";

import { IntegrationCapability } from "./adapters/capabilities";
import {
  adapterAllowsLivePublish,
  type IntegrationAdapter,
  type PreparedChange,
} from "./adapters/types";
import {
  buildExecutionIdempotencyKey,
  buildExecutionListWhere,
  canTransitionExecutionStatus,
  foundationExternalActionsEnabled,
  isTerminalExecutionStatus,
  resolveIdempotentCreate,
} from "./execution-jobs-core";
import {
  assertPayloadHasNoSecrets,
  sanitizeExecutionErrorMessage,
  sanitizeExecutionPayload,
} from "./execution-sanitize";
import {
  evaluateLivePublishGate,
  isLivePublishAction,
  LIVE_PUBLISH_KILL_SWITCH_ENGAGED,
  livePublishBlockedReason,
} from "./live-publish-gate";

// --- sanitize: never includes secrets / HTML ---
{
  const dirty = {
    title: "Hello",
    slug: "hello",
    applicationPassword: "xxxx yyyy zzzz aaaa",
    secret: "super-secret",
    accessToken: "Bearer abc.def.ghi",
    contentHtml: "<p>leak</p>",
    password: "hunter2",
    apiKey: "sk_live_abc",
    capability: "create_wordpress_draft",
    provider: "WORDPRESS",
    action: "CREATE_DRAFT",
  };
  const clean = sanitizeExecutionPayload(dirty);
  assert.ok(clean);
  assert.equal(clean!.title, "Hello");
  assert.equal(assertPayloadHasNoSecrets(clean), true);
  assert.equal(JSON.stringify(clean).includes("hunter2"), false);
}

{
  const msg = sanitizeExecutionErrorMessage(
    "Auth failed Bearer eyJhbGciOiJIUzI1NiJ9.abc.def sk_live_xxx"
  );
  assert.ok(msg);
  assert.equal(msg!.includes("eyJ"), false);
  assert.equal(msg!.includes("sk_live"), false);
}

// --- status transitions ---
{
  assert.equal(canTransitionExecutionStatus("QUEUED", "RUNNING"), true);
  assert.equal(canTransitionExecutionStatus("SUCCEEDED", "RUNNING"), false);
  assert.equal(isTerminalExecutionStatus("SUCCEEDED"), true);
}

// --- failed job stores safe error ---
{
  const safe = sanitizeExecutionErrorMessage(
    "WP error password=abc secret=xyz token=Bearer aaa"
  );
  assert.ok(safe);
  assert.ok(!/Bearer\s+\S+/i.test(safe!));
}

// --- idempotency ---
{
  const key = buildExecutionIdempotencyKey({
    organizationId: "org-1",
    websiteId: "web-1",
    provider: "WORDPRESS",
    action: "CREATE_DRAFT",
    sourceType: "ARTICLE",
    sourceId: "art-1",
    capability: IntegrationCapability.CREATE_WORDPRESS_DRAFT,
  });
  const store = new Map<string, { id: string }>();
  const first = resolveIdempotentCreate(store, key, () => ({ id: "job-1" }));
  const second = resolveIdempotentCreate(store, key, () => ({ id: "job-2" }));
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.value.id, "job-1");
}

// --- tenant isolation where clause ---
{
  const where = buildExecutionListWhere({
    organizationId: "org-A",
    websiteId: "web-A",
  });
  assert.deepEqual(where, {
    organizationId: "org-A",
    websiteId: "web-A",
  });
}

// --- live publish: end state, currently gated ---
{
  assert.equal(LIVE_PUBLISH_KILL_SWITCH_ENGAGED, true);
  assert.equal(isLivePublishAction("PUBLISH"), true);
  assert.equal(isLivePublishAction("CREATE_DRAFT"), false);
  assert.equal(foundationExternalActionsEnabled(), false);

  const closed = evaluateLivePublishGate({
    websiteAllowsLivePublish: true,
    executionHistoryAvailable: true,
    qualityGatePassed: true,
    rollbackStrategyReady: true,
  });
  assert.equal(closed.productEndState, "live_publish");
  assert.equal(closed.livePublishEnabled, false);
  assert.equal(closed.killSwitchEngaged, true);
  assert.equal(livePublishBlockedReason(closed), "live_publish_kill_switch");
  assert.ok(closed.missingPrerequisites.includes("kill_switch_cleared"));

  const planScoped = evaluateLivePublishGate({
    planApproved: true,
    planPublishingMode: "AUTO_PUBLISH",
    qualityGatePassed: true,
  });
  assert.equal(planScoped.permissionGranted, true);
  assert.equal(planScoped.livePublishEnabled, false);
  assert.ok(planScoped.missingPrerequisites.includes("kill_switch_cleared"));

  const reviewOnlyPlan = evaluateLivePublishGate({
    planApproved: true,
    planPublishingMode: "REVIEW_ONLY",
    qualityGatePassed: true,
  });
  assert.equal(reviewOnlyPlan.permissionGranted, false);
  assert.ok(
    reviewOnlyPlan.missingPrerequisites.includes("approved_plan_auto_publish")
  );

  const missingPerms = evaluateLivePublishGate({});
  assert.ok(
    missingPerms.missingPrerequisites.includes("per_website_permission") ||
      missingPerms.missingPrerequisites.includes("approved_plan_auto_publish")
  );
  assert.ok(missingPerms.missingPrerequisites.includes("quality_gates"));
  assert.ok(missingPerms.missingPrerequisites.includes("rollback_strategy"));
  assert.ok(missingPerms.missingPrerequisites.includes("execution_history"));
}

// --- adapter: supports publish capability, gate keeps live off ---
{
  const adapter: IntegrationAdapter = {
    provider: "WORDPRESS",
    capabilities: [
      IntegrationCapability.CREATE_WORDPRESS_DRAFT,
      IntegrationCapability.PUBLISH_WORDPRESS_ARTICLE,
    ],
    supports(cap) {
      return this.capabilities.includes(cap);
    },
    prepare(input) {
      return Promise.resolve({
        preview: input.change,
        externalActionPerformed: false,
      });
    },
  };
  assert.equal(adapterAllowsLivePublish(adapter), false);
  assert.equal(
    adapterAllowsLivePublish(adapter, {
      websiteAllowsLivePublish: true,
      executionHistoryAvailable: true,
      qualityGatePassed: true,
      rollbackStrategyReady: true,
    }),
    false,
    "kill switch must keep live publish disabled"
  );

  const change: PreparedChange = {
    target: "article",
    sourceType: "ARTICLE",
    sourceId: "a1",
    action: "PUBLISH",
    provider: "WORDPRESS",
    mode: "AUTO_PUBLISH",
    capability: IntegrationCapability.PUBLISH_WORDPRESS_ARTICLE,
    title: "T",
  };

  void adapter
    .prepare({ organizationId: "o", websiteId: "w", change })
    .then((prepared) => {
      assert.equal(prepared.externalActionPerformed, false);
      console.log("execution-foundation.test.ts: ok");
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
