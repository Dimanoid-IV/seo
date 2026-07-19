/**
 * Integration Adapter contracts.
 *
 * Product end state: adapters will execute live publish when the live-publish
 * gate opens. First implementation: prepare/preview only; execute stays gated.
 */

import type { IntegrationCapability } from "./capabilities";
import {
  evaluateLivePublishGate,
  type LivePublishGateInput,
} from "../live-publish-gate";

export type IntegrationAdapterProvider =
  | "WORDPRESS"
  | "CUSTOM_WEBHOOK"
  | "HOSTED_BLOG"
  | "MANUAL"
  | "OTHER";

export type IntegrationAdapterAction =
  | "CREATE_DRAFT"
  | "PUBLISH"
  | "UPDATE_ARTICLE"
  | "APPLY_SEO_FIX"
  | "SEND_WEBHOOK"
  | "PREPARE_PACKAGE"
  | "ROLLBACK"
  | "TEST_CONNECTION";

export type IntegrationAdapterMode =
  | "REVIEW_ONLY"
  | "AUTO_DRAFT"
  | "AUTO_PUBLISH";

export type PreparedChangeTarget = "article" | "task_prepared_fix" | "manual";

/**
 * Normalized prepared change for Article / Task preparedFix / manual package.
 * Never includes credentials or full unsanitized HTML bodies in previews.
 */
export type PreparedChange = {
  target: PreparedChangeTarget;
  sourceType: "ARTICLE" | "TASK" | "PREPARED_FIX" | "AUTOPILOT_PLAN_ITEM" | "MANUAL";
  sourceId: string;
  action: IntegrationAdapterAction;
  provider: IntegrationAdapterProvider;
  mode: IntegrationAdapterMode;
  capability: IntegrationCapability;
  title?: string | null;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  language?: string | null;
  /** Length of HTML only — never the HTML itself in adapter preview. */
  contentHtmlLength?: number | null;
  summary?: string | null;
};

export type AdapterPrepareInput = {
  organizationId: string;
  websiteId: string;
  change: PreparedChange;
};

export type AdapterPrepareResult = {
  preview: PreparedChange;
  /**
   * Side effects performed during prepare.
   * Foundation runners must keep this false; live execute comes later via gate.
   */
  externalActionPerformed: boolean;
};

export type AdapterExecuteInput = AdapterPrepareInput & {
  jobId: string;
  gate: LivePublishGateInput;
};

export type AdapterExecuteResult = {
  externalId?: string | null;
  externalUrl?: string | null;
  result?: Record<string, unknown> | null;
  externalActionPerformed: boolean;
};

/**
 * Website Integration Adapter interface.
 * - prepare: always available for preview / job recording
 * - execute: optional; live publish/webhook only when live-publish gate allows
 */
export interface IntegrationAdapter {
  readonly provider: IntegrationAdapterProvider;
  readonly capabilities: readonly IntegrationCapability[];
  supports(capability: IntegrationCapability): boolean;
  prepare(input: AdapterPrepareInput): Promise<AdapterPrepareResult>;
  /**
   * Future live path. Must refuse when evaluateLivePublishGate().livePublishEnabled
   * is false for PUBLISH / SEND_WEBHOOK capabilities.
   */
  execute?(input: AdapterExecuteInput): Promise<AdapterExecuteResult>;
}

/**
 * Whether this adapter + site context may perform live publish right now.
 * End state can be true; today the kill switch keeps it false.
 */
export function adapterAllowsLivePublish(
  adapter: Pick<IntegrationAdapter, "capabilities">,
  gateInput: LivePublishGateInput = {}
): boolean {
  const supportsPublish = adapter.capabilities.some(
    (cap) =>
      cap === "publish_wordpress_article" || cap === "send_custom_webhook"
  );
  if (!supportsPublish) return false;
  return evaluateLivePublishGate(gateInput).livePublishEnabled;
}
