/**
 * Integration Adapter contracts (Prompt 11.49 foundation).
 * No external network / publish / webhook send.
 */

import type { IntegrationCapability } from "./capabilities";

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
  /** Always false in foundation — adapters must not perform side effects. */
  externalActionPerformed: false;
};

/**
 * Website Integration Adapter interface.
 * Foundation only: prepare/preview — no execute/publish/send.
 */
export interface IntegrationAdapter {
  readonly provider: IntegrationAdapterProvider;
  readonly capabilities: readonly IntegrationCapability[];
  supports(capability: IntegrationCapability): boolean;
  prepare(input: AdapterPrepareInput): Promise<AdapterPrepareResult>;
}

/**
 * Assert foundation adapters never advertise live publish execution.
 */
export function adapterAllowsLivePublish(
  adapter: Pick<IntegrationAdapter, "capabilities">
): boolean {
  // Capability may exist for future wiring; foundation runners must not call it.
  void adapter;
  return false;
}
