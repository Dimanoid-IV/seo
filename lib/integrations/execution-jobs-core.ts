/**
 * Pure helpers for integration execution jobs (no DB / no server-only).
 */

import type {
  IntegrationExecutionAction,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
} from "@prisma/client";

import {
  evaluateLivePublishGate,
  isLivePublishKillSwitchEngaged,
} from "./live-publish-gate";

export type ExecutionStatus = IntegrationExecutionStatus;


const TERMINAL: ReadonlySet<string> = new Set([
  "SUCCEEDED",
  "FAILED",
  "PARTIALLY_APPLIED",
  "CANCELED",
]);

const ALLOWED_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  QUEUED: new Set(["RUNNING", "WAITING", "CANCELED", "FAILED"]),
  RUNNING: new Set([
    "SUCCEEDED",
    "FAILED",
    "PARTIALLY_APPLIED",
    "RETRYING",
    "WAITING",
    "CANCELED",
  ]),
  WAITING: new Set(["QUEUED", "RUNNING", "CANCELED", "FAILED"]),
  RETRYING: new Set(["RUNNING", "FAILED", "CANCELED"]),
  SUCCEEDED: new Set(),
  FAILED: new Set(["RETRYING", "QUEUED", "RUNNING"]),
  PARTIALLY_APPLIED: new Set(),
  CANCELED: new Set(),
};

export function canTransitionExecutionStatus(
  from: IntegrationExecutionStatus | string,
  to: IntegrationExecutionStatus | string
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.has(to) === true;
}

export function isTerminalExecutionStatus(
  status: IntegrationExecutionStatus | string
): boolean {
  return TERMINAL.has(status);
}

export function buildExecutionIdempotencyKey(input: {
  organizationId: string;
  websiteId: string;
  provider: IntegrationExecutionProvider | string;
  action: IntegrationExecutionAction | string;
  sourceType: IntegrationExecutionSourceType | string;
  sourceId: string;
  capability: string;
}): string {
  return [
    input.organizationId,
    input.websiteId,
    input.provider,
    input.action,
    input.sourceType,
    input.sourceId,
    input.capability,
  ].join(":");
}

export function buildExecutionListWhere(input: {
  organizationId: string;
  websiteId: string;
}): { organizationId: string; websiteId: string } {
  return {
    organizationId: input.organizationId,
    websiteId: input.websiteId,
  };
}

/**
 * Whether external adapter execute (including live publish) may run.
 * Product end state can be true; kill switch stays engaged by default.
 */
export function foundationExternalActionsEnabled(): boolean {
  return (
    !isLivePublishKillSwitchEngaged() &&
    evaluateLivePublishGate({
      websiteAllowsLivePublish: true,
      executionHistoryAvailable: true,
      qualityGatePassed: true,
      rollbackStrategyReady: true,
      killSwitchEngaged: isLivePublishKillSwitchEngaged(),
    }).livePublishEnabled
  );
}

/**
 * In-memory idempotency map for unit tests (no Prisma).
 */
export function resolveIdempotentCreate<T>(
  store: Map<string, T>,
  idempotencyKey: string,
  create: () => T
): { value: T; created: boolean } {
  const existing = store.get(idempotencyKey);
  if (existing) return { value: existing, created: false };
  const value = create();
  store.set(idempotencyKey, value);
  return { value, created: true };
}
