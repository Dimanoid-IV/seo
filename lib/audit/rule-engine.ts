import { AUDIT_RULES } from "./rules/index";
import type {
  AuditRuleContext,
  AuditRuleResult,
  AuditRuleSeverity,
  AuditRuleStatus,
} from "./rules-types";
import {
  AuditRuleSeverity as Severity,
  AuditRuleStatus as Status,
} from "./rules-types";
import { createRuleResult, RuleConfig } from "./rules/shared/create-result";

const STATUS_SORT_ORDER: Record<AuditRuleStatus, number> = {
  [Status.FAIL]: 0,
  [Status.WARNING]: 1,
  [Status.NOT_APPLICABLE]: 2,
  [Status.PASS]: 3,
};

const SEVERITY_SORT_ORDER: Record<AuditRuleSeverity, number> = {
  [Severity.CRITICAL]: 0,
  [Severity.HIGH]: 1,
  [Severity.MEDIUM]: 2,
  [Severity.LOW]: 3,
  [Severity.INFO]: 4,
};

function sortRuleResults(results: AuditRuleResult[]): AuditRuleResult[] {
  return [...results].sort((a, b) => {
    const statusDiff =
      STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    const severityDiff =
      SEVERITY_SORT_ORDER[a.severity] - SEVERITY_SORT_ORDER[b.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    return b.scoreImpact - a.scoreImpact;
  });
}

function createRuleFailureResult(checkerName: string, error: unknown): AuditRuleResult {
  return createRuleResult({
    config: RuleConfig.RULE_EXECUTION_FAILED,
    status: Status.NOT_APPLICABLE,
    title: "Техническая проверка не завершилась",
    description: `Правило ${checkerName} завершилось с ошибкой.`,
    whyItMatters: "Отдельная проверка не повлияла на остальной аудит.",
    recommendation:
      "Повторите аудит позже или сообщите в поддержку, если проблема повторяется.",
    evidence: {
      checker: checkerName,
      error: error instanceof Error ? error.message : String(error),
    },
  });
}

/**
 * Runs all deterministic audit rules against scan + on-page data.
 * Does not use AI, Hermes, or database access.
 *
 * @param context - Scanner result and extracted on-page SEO facts
 * @returns Sorted array of rule results (FAIL/WARNING first, then by severity and scoreImpact)
 */
export function runAuditRules(context: AuditRuleContext): AuditRuleResult[] {
  const results: AuditRuleResult[] = [];

  for (const checker of AUDIT_RULES) {
    try {
      results.push(checker(context));
    } catch (error) {
      results.push(createRuleFailureResult(checker.name || "anonymous", error));
    }
  }

  return sortRuleResults(results);
}

/**
 * Returns top preview-visible issues for the free audit funnel.
 *
 * @param results - Full rule results from {@link runAuditRules}
 * @param limit - Maximum number of issues (default 5)
 */
export function getPreviewIssues(
  results: AuditRuleResult[],
  limit = 5
): AuditRuleResult[] {
  return sortRuleResults(
    results.filter(
      (result) =>
        result.isVisibleInPreview &&
        (result.status === Status.FAIL || result.status === Status.WARNING)
    )
  ).slice(0, limit);
}

/**
 * Calculates a raw 0–100 score from rule results (not the final Growth Score).
 * Starts at 100 and subtracts scoreImpact for FAIL and WARNING results.
 *
 * @param results - Rule results from {@link runAuditRules}
 */
export function calculateRawRuleScore(results: AuditRuleResult[]): number {
  let score = 100;

  for (const result of results) {
    if (result.status === Status.FAIL || result.status === Status.WARNING) {
      score -= result.scoreImpact;
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Sums estimated fix minutes for FAIL and WARNING results.
 *
 * @param results - Rule results from {@link runAuditRules}
 */
export function calculateEstimatedFixTime(results: AuditRuleResult[]): number {
  let totalMinutes = 0;

  for (const result of results) {
    if (result.status === Status.FAIL || result.status === Status.WARNING) {
      totalMinutes += result.estimatedFixMinutes;
    }
  }

  return totalMinutes;
}
