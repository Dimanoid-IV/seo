/**
 * Live publish product policy (RankBoost).
 *
 * End state: live publish is required.
 * Plan-scoped permission (11.50): after confirming a monthly plan with
 * AUTO_PUBLISH, articles that pass the quality gate are permitted — without
 * per-article confirmation. Global kill switch / rollback still gate execution.
 *
 * Prompt 11.51: WordPress adapter execution exists; kill switch stays engaged
 * by default until LIVE_PUBLISH_KILL_SWITCH is explicitly cleared.
 */

import { IntegrationCapability } from "./adapters/capabilities";
import {
  isApprovedPlanArticleLivePublishPermitted,
  isPlanAutoPublishMode,
} from "@/lib/autopilot/plan-publishing-mode";

/**
 * Global kill switch — engaged blocks all live publish / live webhook send.
 * Clear only via env: LIVE_PUBLISH_KILL_SWITCH=cleared|0|false|off
 */
export function isLivePublishKillSwitchEngaged(): boolean {
  const raw = process.env.LIVE_PUBLISH_KILL_SWITCH?.trim().toLowerCase();
  if (
    raw === "0" ||
    raw === "false" ||
    raw === "cleared" ||
    raw === "off" ||
    raw === "disabled"
  ) {
    return false;
  }
  if (
    raw === "1" ||
    raw === "true" ||
    raw === "engaged" ||
    raw === "on" ||
    raw === "enabled"
  ) {
    return true;
  }
  // Safe default: engaged (blocks live publish on customer sites).
  return true;
}

/** Snapshot for callers / tests that need a boolean constant at import time. */
export const LIVE_PUBLISH_KILL_SWITCH_ENGAGED = true as boolean;

export const LIVE_PUBLISH_PREREQUISITES = [
  "per_website_permission",
  "approved_plan_auto_publish",
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
  /** Monthly plan is APPROVED. */
  planApproved?: boolean;
  /** Plan publishing mode chosen at confirm (REVIEW_ONLY | AUTO_PUBLISH). */
  planPublishingMode?: string | null;
  /** Execution history subsystem available for this website. */
  executionHistoryAvailable?: boolean;
  /** Quality gate passed for the change being published. */
  qualityGatePassed?: boolean;
  /** Rollback strategy registered for the provider/action. */
  rollbackStrategyReady?: boolean;
  /** Override kill-switch check (tests / article-level gate). */
  killSwitchEngaged?: boolean;
};

export type LivePublishGateState = {
  /** Product destination — not draft-only forever. */
  productEndState: "live_publish";
  killSwitchEngaged: boolean;
  /**
   * Plan/user granted live-publish permission for this scope
   * (approved plan + AUTO_PUBLISH + quality when provided).
   */
  permissionGranted: boolean;
  /** May actually execute live publish (permission + kill switch + remaining prereqs). */
  livePublishEnabled: boolean;
  missingPrerequisites: LivePublishPrerequisite[];
  websiteId: string | null;
};

const LIVE_PUBLISH_ACTIONS = new Set(["PUBLISH", "SEND_WEBHOOK"]);

const LIVE_PUBLISH_CAPABILITIES = new Set<string>([
  IntegrationCapability.PUBLISH_WORDPRESS_ARTICLE,
  IntegrationCapability.SEND_CUSTOM_WEBHOOK,
]);

function hasPlanScopedPermission(input: LivePublishGateInput): boolean {
  if (input.websiteAllowsLivePublish === true) return true;
  if (input.planApproved !== true) return false;
  if (!isPlanAutoPublishMode(input.planPublishingMode)) return false;
  // If quality is provided, require pass; if omitted, plan-level permission only.
  if (input.qualityGatePassed === false) return false;
  return true;
}

/**
 * Evaluates whether live publish may run for a website/change.
 */
export function evaluateLivePublishGate(
  input: LivePublishGateInput = {}
): LivePublishGateState {
  const missing: LivePublishPrerequisite[] = [];
  const permissionGranted = hasPlanScopedPermission(input);
  const killSwitchEngaged =
    typeof input.killSwitchEngaged === "boolean"
      ? input.killSwitchEngaged
      : isLivePublishKillSwitchEngaged();

  if (killSwitchEngaged) {
    missing.push("kill_switch_cleared");
  }
  if (!permissionGranted) {
    if (
      input.planApproved === true &&
      !isPlanAutoPublishMode(input.planPublishingMode)
    ) {
      missing.push("approved_plan_auto_publish");
    } else if (input.websiteAllowsLivePublish !== true) {
      missing.push("per_website_permission");
    } else {
      missing.push("approved_plan_auto_publish");
    }
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

  const livePublishEnabled = missing.length === 0;

  return {
    productEndState: "live_publish",
    killSwitchEngaged,
    permissionGranted,
    livePublishEnabled,
    missingPrerequisites: missing,
    websiteId: input.websiteId ?? null,
  };
}

export function evaluateArticleLivePublishPermission(input: {
  websiteId?: string | null;
  planStatus: string;
  planPublishingMode: string | null | undefined;
  qualityPassed: boolean | null | undefined;
  executionHistoryAvailable?: boolean;
  rollbackStrategyReady?: boolean;
  killSwitchEngaged?: boolean;
}): LivePublishGateState {
  const planApproved = input.planStatus.toUpperCase() === "APPROVED";
  const articlePermitted = isApprovedPlanArticleLivePublishPermitted({
    planStatus: input.planStatus,
    publishingMode: input.planPublishingMode,
    qualityPassed: input.qualityPassed,
  });

  return evaluateLivePublishGate({
    websiteId: input.websiteId,
    planApproved,
    planPublishingMode: input.planPublishingMode,
    qualityGatePassed: input.qualityPassed === true,
    websiteAllowsLivePublish: articlePermitted,
    executionHistoryAvailable: input.executionHistoryAvailable,
    rollbackStrategyReady: input.rollbackStrategyReady,
    killSwitchEngaged: input.killSwitchEngaged,
  });
}

export function isLivePublishAction(action: string): boolean {
  return LIVE_PUBLISH_ACTIONS.has(action);
}

export function isLivePublishCapability(capability: string): boolean {
  return LIVE_PUBLISH_CAPABILITIES.has(capability);
}

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
