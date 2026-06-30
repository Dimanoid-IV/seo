import type { OnPageSeoData } from "./onpage-types";
import type { WebsiteScanResult } from "./types";

export const AuditRuleCategory = {
  TECHNICAL: "TECHNICAL",
  CONTENT: "CONTENT",
  LOCAL_SEO: "LOCAL_SEO",
  PERFORMANCE: "PERFORMANCE",
  ACCESSIBILITY: "ACCESSIBILITY",
  AI_READINESS: "AI_READINESS",
  SECURITY: "SECURITY",
  CONVERSION: "CONVERSION",
  SOCIAL: "SOCIAL",
  OTHER: "OTHER",
} as const;

export type AuditRuleCategory =
  (typeof AuditRuleCategory)[keyof typeof AuditRuleCategory];

export const AuditRuleSeverity = {
  INFO: "INFO",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type AuditRuleSeverity =
  (typeof AuditRuleSeverity)[keyof typeof AuditRuleSeverity];

export const AuditRuleStatus = {
  PASS: "PASS",
  WARNING: "WARNING",
  FAIL: "FAIL",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export type AuditRuleStatus =
  (typeof AuditRuleStatus)[keyof typeof AuditRuleStatus];

export type AuditRuleResult = {
  code: string;
  category: AuditRuleCategory;
  status: AuditRuleStatus;
  severity: AuditRuleSeverity;
  title: string;
  description: string;
  whyItMatters: string;
  recommendation: string;
  scoreImpact: number;
  evidence?: Record<string, unknown>;
  isVisibleInPreview: boolean;
  estimatedFixMinutes: number;
};

export type AuditRuleContext = {
  scan: WebsiteScanResult;
  onPage: OnPageSeoData;
};

export type AuditRuleChecker = (context: AuditRuleContext) => AuditRuleResult;
