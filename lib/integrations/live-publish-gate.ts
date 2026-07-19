/**
 * Live publish product policy (RankBoost).
 *
 * End state: live publish is required.
 * First implementation: live publish stays disabled until every prerequisite
 * below is satisfied. This is a gated rollout, not a draft-only product.
 */

import { IntegrationCapability } from "./adapters/capabilities";

/** Global kill switch — engage to block all live publish / live webhook send. */
export const LIVE_PUBLISH_KILL_SWITCH_ENGAGED = true as const;

export const LIVE_PUBLISH_PREREQUISITES = [
  "per_website_permission",
  "execution_history",
  "quality_gates",
  "rollback_strategy",
  "kill_switch_cleared",
] as const;

export type LivePublishPrerequisite =
  (typeof LIVE_PUBLISH_PREREQUISITES)[number];

export type LivePublishGateInput = {
  websiteId?: string | null;
  /** Explicit per-website permission to allow live publish. */
  websiteAllowsLivePublish?: boolean;
  /** Execution history subsystem available for this website. */
  executionHistoryAvailable?: boolean;
  /** Quality gate passed for the change being published. */
  qualityGatePassed?: boolean;
  /** Rollback strategy registered for the provider/action. */
  rollbackStrategyReady?: boolean;
};

export type LivePublishGateState = {
  /** Product destination — not draft-only forever. */
  productEndState: "live_publish";
  killSwitchEngaged: boolean;
  /** True only when kill switch is off and all prerequisites pass. */
  livePublishEnabled: boolean;
  missingPrerequisites: LivePublishPrerequisite[];
  websiteId: string | null;
};

const LIVE_PUBLISH_ACTIONS = new Set(["PUBLISH", "SEND_WEBHOOK"]);

const LIVE_PUBLISH_CAPABILITIES = new Set<string>([
  IntegrationCapability.PUBLISH_WORDPRESS_ARTICLE,
  IntegrationCapability.SEND_CUSTOM_WEBHOOK,
]);

/**
 * Evaluates whether live publish may run for a website/change.
 * Today this always returns disabled because the kill switch is engaged
 * and per-website permissions / rollback are not yet productized.
 */
export function evaluateLivePublishGate(
  input: LivePublishGateInput = {}
): LivePublishGateState {
  const missing: LivePublishPrerequisite[] = [];

  if (LIVE_PUBLISH_KILL_SWITCH_ENGAGED) {
    missing.push("kill_switch_cleared");
  }
  if (input.websiteAllowsLivePublish !== true) {
    missing.push("per_website_permission");
  }
  if (input.executionHistoryAvailable !== true) {
    missing.push("execution_history");
  }
  if (input.qualityGatePassed !== true) {
    missing.push("quality_gates");
  }
  if (input.rollbackStrategyReady !== true) {
    missing.push("rollback_strategy");
  }

  return {
    productEndState: "live_publish",
    killSwitchEngaged: LIVE_PUBLISH_KILL_SWITCH_ENGAGED,
    livePublishEnabled: missing.length === 0,
    missingPrerequisites: missing,
    websiteId: input.websiteId ?? null,
  };
}

export function isLivePublishAction(action: string): boolean {
  return LIVE_PUBLISH_ACTIONS.has(action);
}

export function isLivePublishCapability(capability: string): boolean {
  return LIVE_PUBLISH_CAPABILITIES.has(capability);
}

/**
 * Evaluates the live-publish gate for a potential live action.
 * Draft / prepare / test-connection are not live-publish actions.
 */
export function assertLivePublishAllowed(
  input: LivePublishGateInput
): LivePublishGateState {
  return evaluateLivePublishGate(input);
}

export function livePublishBlockedReason(
  gate: LivePublishGateState
): string | null {
  if (gate.livePublishEnabled) return null;
  if (gate.killSwitchEngaged) {
    return "live_publish_kill_switch";
  }
  return gate.missingPrerequisites[0] ?? "live_publish_prerequisites";
}
