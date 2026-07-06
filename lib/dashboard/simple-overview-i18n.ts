import "server-only";

import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { getServerStrings } from "@/lib/i18n/saas/server-strings";
import type {
  ControlCenterRecommendedAction,
  AutopilotControlCenterViewModel,
} from "@/lib/autopilot-control/types";
import type { OnboardingSummary } from "@/lib/onboarding/types";

import type { SimpleDashboardTone, SimpleDashboardViewModel } from "./simple-overview";

export function localizedGrowthScoreLabel(
  locale: SaasLocale,
  score: number | undefined,
  hasAudit: boolean
): string {
  const labels = getServerStrings(locale).dashboard.growthScore;
  if (score == null || !hasAudit) return labels.notEnough;
  if (score >= 75) return labels.lookingGood;
  if (score >= 50) return labels.roomToGrow;
  return labels.needsAttention;
}

export function localizedActionButtonLabel(
  locale: SaasLocale,
  action: ControlCenterRecommendedAction
): string {
  const labels = getServerStrings(locale).dashboard.actionLabels;
  switch (action.type) {
    case "GENERATE_MONTHLY_PLAN":
      return labels.openGrowthPlan;
    case "GENERATE_EMAIL_APPROVAL":
    case "REVIEW_EMAIL":
      return labels.reviewEmail;
    case "REVIEW_ARTICLE":
      return labels.viewDrafts;
    case "COPY_SOCIAL_POST":
      return labels.viewPosts;
    case "CONNECT_INTEGRATION":
      return labels.connectGsc;
    case "RUN_AUDIT":
      return labels.runAudit;
    case "OPEN_TASK":
      return labels.viewTasks;
    case "VIEW_TIMELINE":
      return labels.openTimeline;
    default:
      return labels.open;
  }
}

export function localizedNextAction(
  locale: SaasLocale,
  action: ControlCenterRecommendedAction | undefined
): SimpleDashboardViewModel["nextBestAction"] {
  if (!action) return undefined;

  const copy = getServerStrings(locale).dashboard;
  let title = action.title;
  let description = action.description;

  switch (action.type) {
    case "GENERATE_MONTHLY_PLAN":
      title = copy.nextAction.reviewPlanTitle;
      description = copy.nextAction.reviewPlanDesc;
      break;
    case "RUN_AUDIT":
      title = copy.nextAction.runAuditTitle;
      description = copy.nextAction.runAuditDesc;
      break;
    case "CONNECT_INTEGRATION":
      title = copy.nextAction.connectGscTitle;
      description = copy.nextAction.connectGscDesc;
      break;
    case "REVIEW_EMAIL":
      title = copy.nextAction.reviewEmailTitle;
      description = copy.nextAction.reviewEmailDesc;
      break;
    default:
      break;
  }

  return {
    title,
    description,
    label: localizedActionButtonLabel(locale, action),
    href: action.href,
    apiAction: action.apiAction,
    tone: "PRIMARY",
  };
}

export function localizedFindings(
  locale: SaasLocale,
  control: AutopilotControlCenterViewModel,
  opportunitiesCount: number
): SimpleDashboardViewModel["findings"] {
  const f = getServerStrings(locale).dashboard.findings;
  const findings: SimpleDashboardViewModel["findings"] = [];

  if (control.metrics.openTasksCount > 0) {
    findings.push({
      title: f.seoTasksWaiting(control.metrics.openTasksCount),
      href: "/app/autopilot-control",
    });
  }

  if (control.monthlyPlan && control.monthlyPlan.status !== "approved") {
    findings.push({
      title: f.planReady,
      href: control.monthlyPlan.href,
    });
  }

  const gsc = control.integrations.find((i) => i.key === "google_search_console");
  if (gsc && gsc.status !== "CONNECTED") {
    findings.push({
      title: f.gscNotConnected,
      href: "/app/integrations",
    });
  }

  if (control.metrics.readySocialPostsCount > 0) {
    findings.push({
      title: f.socialDraftsReady(control.metrics.readySocialPostsCount),
      href: "/app/social-posts",
    });
  }

  if (control.metrics.pendingEmailsCount > 0) {
    findings.push({
      title: f.emailDraftsWaiting(control.metrics.pendingEmailsCount),
      href: "/app/email-approvals",
    });
  }

  if (opportunitiesCount > 0 && findings.length < 5) {
    findings.push({
      title: f.opportunitiesFound(opportunitiesCount),
      href: "/app/autopilot-control",
    });
  }

  return findings.slice(0, 5);
}

function mapTone(
  overall: AutopilotControlCenterViewModel["status"]["overall"],
  onboardingComplete: boolean
): SimpleDashboardTone {
  if (!onboardingComplete) return "SETUP";
  switch (overall) {
    case "NEEDS_SETUP":
      return "SETUP";
    case "NO_DATA":
      return "NO_DATA";
    case "NEEDS_REVIEW":
      return "NEEDS_REVIEW";
    default:
      return "GOOD";
  }
}

export function localizedHeroStatus(
  locale: SaasLocale,
  control: AutopilotControlCenterViewModel,
  onboarding: OnboardingSummary
): SimpleDashboardViewModel["status"] {
  const h = getServerStrings(locale).dashboard.hero;
  const onboardingComplete =
    onboarding.status === "COMPLETED" || onboarding.status === "SKIPPED";

  if (!control.website) {
    return { label: h.getStarted, description: h.getStartedDesc, tone: "NO_DATA" };
  }

  if (!onboardingComplete) {
    return { label: h.finishSetup, description: h.finishSetupDesc, tone: "SETUP" };
  }

  if (!control.metrics.growthScore && control.status.overall === "NEEDS_SETUP") {
    return {
      label: h.runFirstAudit,
      description: h.runFirstAuditDesc,
      tone: "SETUP",
    };
  }

  const needsReview =
    control.approvalQueue.filter((q) => q.priority !== "LOW").length;

  if (needsReview > 0) {
    return {
      label: h.actionsReady,
      description: h.actionsReadyDesc,
      tone: "NEEDS_REVIEW",
    };
  }

  if (control.status.overall === "READY") {
    return {
      label: h.planActive,
      description: h.planActiveDesc,
      tone: "GOOD",
    };
  }

  return {
    label: control.status.label,
    description: control.status.description,
    tone: mapTone(control.status.overall, onboardingComplete),
  };
}

export function localizedBillingNote(
  locale: SaasLocale,
  subscriptionPlan?: string
): string | undefined {
  if (subscriptionPlan === "free" || subscriptionPlan === "FREE") {
    return getServerStrings(locale).dashboard.billingNoteFree;
  }
  return undefined;
}

export function localizedSecondaryAction(
  locale: SaasLocale,
  input: {
    primaryType?: string;
    onboardingStatus: OnboardingSummary["status"];
  }
): SimpleDashboardViewModel["secondaryAction"] {
  const s = getServerStrings(locale).dashboard.secondary;
  if (input.primaryType === "CONNECT_INTEGRATION") {
    return { label: s.doLater, href: "/app/integrations" };
  }
  if (input.onboardingStatus !== "COMPLETED" && input.onboardingStatus !== "SKIPPED") {
    return { label: s.openSetup, href: "/app/onboarding" };
  }
  return undefined;
}
