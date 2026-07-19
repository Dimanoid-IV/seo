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
  assert.equal(clean!.slug, "hello");
  assert.equal(clean!.capability, "create_wordpress_draft");
  assert.equal(clean!.applicationPassword, undefined);
  assert.equal(clean!.secret, undefined);
  assert.equal(clean!.accessToken, undefined);
  assert.equal(clean!.contentHtml, undefined);
  assert.equal(clean!.password, undefined);
  assert.equal(clean!.apiKey, undefined);
  assert.equal(assertPayloadHasNoSecrets(clean), true);
  assert.equal(
    JSON.stringify(clean).includes("hunter2"),
    false,
    "secret value must not appear"
  );
  assert.equal(JSON.stringify(clean).includes("<p>leak</p>"), false);
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
  assert.equal(canTransitionExecutionStatus("RUNNING", "SUCCEEDED"), true);
  assert.equal(canTransitionExecutionStatus("RUNNING", "FAILED"), true);
  assert.equal(canTransitionExecutionStatus("SUCCEEDED", "RUNNING"), false);
  assert.equal(canTransitionExecutionStatus("FAILED", "RETRYING"), true);
  assert.equal(canTransitionExecutionStatus("CANCELED", "QUEUED"), false);
  assert.equal(isTerminalExecutionStatus("SUCCEEDED"), true);
  assert.equal(isTerminalExecutionStatus("QUEUED"), false);
}

// --- failed job stores safe error ---
{
  const safe = sanitizeExecutionErrorMessage(
    "WP error password=abc secret=xyz token=Bearer aaa"
  );
  assert.ok(safe);
  assert.equal(safe!.includes("password=abc"), false);
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
  assert.equal(store.size, 1);
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
  assert.notEqual(where.organizationId, "org-B");
  assert.notEqual(where.websiteId, "web-B");
}

// --- no external action ---
{
  assert.equal(foundationExternalActionsEnabled(), false);

  const adapter: IntegrationAdapter = {
    provider: "WORDPRESS",
    capabilities: [IntegrationCapability.CREATE_WORDPRESS_DRAFT],
    supports(cap) {
      return this.capabilities.includes(cap);
    },
    prepare(input) {
      return Promise.resolve({
        preview: input.change,
        externalActionPerformed: false as const,
      });
    },
  };
  assert.equal(adapterAllowsLivePublish(adapter), false);
  assert.equal(
    "execute" in adapter,
    false,
    "foundation adapter must not expose execute()"
  );

  const change: PreparedChange = {
    target: "article",
    sourceType: "ARTICLE",
    sourceId: "a1",
    action: "CREATE_DRAFT",
    provider: "WORDPRESS",
    mode: "REVIEW_ONLY",
    capability: IntegrationCapability.CREATE_WORDPRESS_DRAFT,
    title: "T",
    contentHtmlLength: 1200,
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
