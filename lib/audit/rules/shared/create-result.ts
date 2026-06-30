import type {
  AuditRuleResult,
  AuditRuleSeverity,
  AuditRuleStatus,
} from "../../rules-types";
import {
  AuditRuleSeverity as Severity,
  AuditRuleStatus as Status,
} from "../../rules-types";
import { RuleConfig, type RuleOutcomeConfig } from "../rule-config";

type RuleDraft = {
  config: RuleOutcomeConfig;
  status: AuditRuleStatus;
  title: string;
  description: string;
  whyItMatters: string;
  recommendation: string;
  evidence?: Record<string, unknown>;
  scoreImpact?: number;
  estimatedFixMinutes?: number;
};

function resolveScoreImpact(
  status: AuditRuleStatus,
  severity: AuditRuleSeverity,
  explicit?: number,
  configImpact?: number
): number {
  if (status === Status.PASS || status === Status.NOT_APPLICABLE) {
    return 0;
  }
  if (explicit !== undefined) {
    return explicit;
  }
  if (configImpact !== undefined && configImpact > 0) {
    return configImpact;
  }
  switch (severity) {
    case Severity.CRITICAL:
      return 10;
    case Severity.HIGH:
      return 7;
    case Severity.MEDIUM:
      return 4;
    case Severity.LOW:
      return 2;
    default:
      return 1;
  }
}

/**
 * Builds a consistent {@link AuditRuleResult} from shared config and copy fields.
 */
export function createRuleResult(draft: RuleDraft): AuditRuleResult {
  return {
    code: draft.config.code,
    category: draft.config.category,
    status: draft.status,
    severity: draft.config.severity,
    title: draft.title,
    description: draft.description,
    whyItMatters: draft.whyItMatters,
    recommendation: draft.recommendation,
    scoreImpact: resolveScoreImpact(
      draft.status,
      draft.config.severity,
      draft.scoreImpact,
      draft.config.scoreImpact
    ),
    evidence: draft.evidence,
    isVisibleInPreview: draft.config.previewVisible,
    estimatedFixMinutes:
      draft.status === Status.PASS || draft.status === Status.NOT_APPLICABLE
        ? 0
        : (draft.estimatedFixMinutes ?? draft.config.estimatedFixMinutes),
  };
}

export { RuleConfig };
