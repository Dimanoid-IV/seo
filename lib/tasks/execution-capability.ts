import type { TaskListItem, TaskIntegrationsContext } from "./types";
import {
  isPageContentFixAuditCode,
  isUnsafeArticleTopic,
} from "@/lib/content-research/keywords";

export type TaskExecutionMode = "MANUAL" | "REVIEW" | "AUTOPILOT";

export type TaskIntegrationRequirement = "NONE" | "WORDPRESS" | "GSC";

export type TaskPrimaryAction =
  | "MARK_DONE"
  | "PREPARE_FIX"
  | "CREATE_DRAFT"
  | "CONNECT_WORDPRESS"
  | "CONNECT_GSC"
  | "APPROVE"
  | "RUN_AUTOMATICALLY";

export type TaskExecutionCapability = {
  mode: TaskExecutionMode;
  defaultMode: TaskExecutionMode;
  autopilotAvailable: boolean;
  autopilotEnabled: boolean;
  integrationRequired: TaskIntegrationRequirement;
  canRankBoostHelp: boolean;
  primaryAction: TaskPrimaryAction;
  simpleHintKey:
    | "manualOnly"
    | "rankBoostCanPrepare"
    | "pageContentFix"
    | "needsApproval"
    | "connectWordPress"
    | "connectGsc";
};

const REVIEW_AUDIT_CODE_PREFIXES = [
  "title_",
  "meta_description_",
  "open_graph",
  "twitter_",
  "word_count",
  "internal_links",
  "schema_",
  "faq_",
  "h1_",
  "html_lang",
  "canonical_",
  "robots_indexable",
] as const;

const MANUAL_AUDIT_CODE_PREFIXES = [
  "https_",
  "status_code_",
  "response_time",
  "security_",
] as const;

const REVIEW_CATEGORIES = new Set(["CONTENT", "SOCIAL"]);

const MANUAL_CATEGORIES = new Set([
  "SECURITY",
  "PERFORMANCE",
  "ACCESSIBILITY",
]);

function matchesPrefix(code: string, prefixes: readonly string[]): boolean {
  const normalized = code.toLowerCase();
  return prefixes.some((prefix) => normalized.startsWith(prefix));
}

function isGscRelatedTask(task: TaskListItem): boolean {
  const haystack = `${task.title} ${task.description ?? ""} ${task.auditCheckCode ?? ""}`.toLowerCase();
  return (
    haystack.includes("search console") ||
    haystack.includes("gsc") ||
    task.auditCheckCode?.toLowerCase().includes("gsc") === true
  );
}

function isWordPressRelatedTask(task: TaskListItem): boolean {
  const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
  return (
    haystack.includes("wordpress") ||
    haystack.includes("плагин") ||
    haystack.includes("plugin")
  );
}

function resolveBaseMode(task: TaskListItem): TaskExecutionMode {
  if (MANUAL_CATEGORIES.has(task.category)) {
    return "MANUAL";
  }

  if (REVIEW_CATEGORIES.has(task.category)) {
    return "REVIEW";
  }

  if (task.auditCheckCode) {
    if (matchesPrefix(task.auditCheckCode, MANUAL_AUDIT_CODE_PREFIXES)) {
      return "MANUAL";
    }
    if (matchesPrefix(task.auditCheckCode, REVIEW_AUDIT_CODE_PREFIXES)) {
      return "REVIEW";
    }
  }

  if (task.category === "TECHNICAL" || task.category === "CONVERSION") {
    if (task.recommendedAction || task.whyItMatters) {
      return "REVIEW";
    }
  }

  if (task.source === "AUDIT" && (task.recommendedAction || task.whyItMatters)) {
    return "REVIEW";
  }

  return "MANUAL";
}

function isAuditPageContentFixTask(task: TaskListItem): boolean {
  if (isPageContentFixAuditCode(task.auditCheckCode)) {
    return true;
  }

  if (task.source === "AUDIT" && isUnsafeArticleTopic(task.title)) {
    return true;
  }

  return false;
}

export function resolveTaskExecutionCapability(
  task: TaskListItem,
  integrations: TaskIntegrationsContext
): TaskExecutionCapability {
  const mode = resolveBaseMode(task);
  const gscReady =
    integrations.gscConnected && integrations.gscPropertySelected;
  const wordpressReady = integrations.wordpressConnected;

  if (isGscRelatedTask(task) && !gscReady) {
    return {
      mode: "MANUAL",
      defaultMode: "REVIEW",
      autopilotAvailable: false,
      autopilotEnabled: false,
      integrationRequired: "GSC",
      canRankBoostHelp: false,
      primaryAction: "CONNECT_GSC",
      simpleHintKey: "connectGsc",
    };
  }

  if (
    isWordPressRelatedTask(task) &&
    !wordpressReady &&
    task.category !== "CONTENT"
  ) {
    return {
      mode: "MANUAL",
      defaultMode: "REVIEW",
      autopilotAvailable: false,
      autopilotEnabled: false,
      integrationRequired: "WORDPRESS",
      canRankBoostHelp: false,
      primaryAction: "CONNECT_WORDPRESS",
      simpleHintKey: "connectWordPress",
    };
  }

  if (task.category === "CONTENT") {
    if (isAuditPageContentFixTask(task)) {
      return {
        mode: "REVIEW",
        defaultMode: "REVIEW",
        autopilotAvailable: false,
        autopilotEnabled: false,
        integrationRequired: "NONE",
        canRankBoostHelp: true,
        primaryAction: "PREPARE_FIX",
        simpleHintKey: "pageContentFix",
      };
    }

    return {
      mode: "REVIEW",
      defaultMode: "REVIEW",
      autopilotAvailable: wordpressReady,
      autopilotEnabled: false,
      integrationRequired: wordpressReady ? "NONE" : "WORDPRESS",
      canRankBoostHelp: true,
      primaryAction: "CREATE_DRAFT",
      simpleHintKey: wordpressReady ? "needsApproval" : "connectWordPress",
    };
  }

  if (mode === "REVIEW") {
    return {
      mode: "REVIEW",
      defaultMode: "REVIEW",
      autopilotAvailable: false,
      autopilotEnabled: false,
      integrationRequired: "NONE",
      canRankBoostHelp: true,
      primaryAction:
        task.category === "SOCIAL" ? "PREPARE_FIX" : "PREPARE_FIX",
      simpleHintKey: "rankBoostCanPrepare",
    };
  }

  return {
    mode: "MANUAL",
    defaultMode: "REVIEW",
    autopilotAvailable: false,
    autopilotEnabled: false,
    integrationRequired: "NONE",
    canRankBoostHelp: false,
    primaryAction: "MARK_DONE",
    simpleHintKey: "manualOnly",
  };
}
