import type { UsageKey } from "@prisma/client";

import type { BillingPlanKey } from "./plans";

export type UsageLimitResult = {
  allowed: boolean;
  current: number;
  limit: number | null;
  plan: BillingPlanKey;
};

export type BillingPlanFeatures = {
  gsc: boolean;
  wordpress: boolean;
  controlCenter: boolean;
  emailSend: boolean;
  advancedReports: boolean;
  agencyMode: boolean;
};

export type BillingSubscriptionViewModel = {
  id: string;
  plan: string;
  planLabel: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string;
  stripeConfigured: boolean;
  canManageBilling: boolean;
  features: BillingPlanFeatures;
};

export type UsageSummaryItem = {
  key: string;
  label: string;
  current: number;
  limit: number;
};

export type UsageSummaryViewModel = {
  month: string;
  items: UsageSummaryItem[];
};

export type BillingPlanViewModel = {
  key: string;
  label: string;
  websites: number;
  monthlyAudits: number;
  monthlyAiGenerations: number;
  monthlyArticles: number;
  monthlySocialPosts: number;
  monthlyAutopilotPlans: number;
  emailApprovals: number;
  reports: number;
  features: BillingPlanFeatures;
  upgradeable: boolean;
  priceLabel: string;
  isCurrent: boolean;
};

export type BillingOverviewResponse = {
  subscription: BillingSubscriptionViewModel;
  usage: UsageSummaryViewModel;
  plans: BillingPlanViewModel[];
};

export const USAGE_KEY_LABELS: Record<UsageKey, string> = {
  AUDIT_RUN: "Audits",
  AI_GENERATION: "AI generations",
  ARTICLE_DRAFT: "Article drafts",
  SOCIAL_POST: "Social posts",
  MONTHLY_AUTOPILOT: "Monthly autopilot plans",
  EMAIL_APPROVAL: "Email approvals",
  REPORT: "Reports",
};

export type BillingErrorCode =
  | "LIMIT_REACHED"
  | "FEATURE_NOT_AVAILABLE"
  | "BILLING_REQUIRED"
  | "BILLING_NOT_CONFIGURED"
  | "BILLING_STATE_LEGACY_OR_INVALID"
  | "BILLING_PORTAL_UNAVAILABLE"
  | "CHECKOUT_FAILED"
  | "ONBOARDING_REQUIRED";
