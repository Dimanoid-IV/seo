import "server-only";

import type { CurrentUser } from "@/lib/auth/types";
import { getAutopilotControlCenter } from "@/lib/autopilot-control/get-control-center";
import type {
  ControlCenterRecommendedAction,
  AutopilotControlCenterViewModel,
} from "@/lib/autopilot-control/types";
import { getOnboardingSummary } from "@/lib/onboarding/get-onboarding-state";
import type { OnboardingSummary } from "@/lib/onboarding/types";

export type SimpleDashboardTone = "GOOD" | "NEEDS_REVIEW" | "SETUP" | "NO_DATA";

export type SimpleDashboardViewModel = {
  website?: {
    id: string;
    name?: string;
    domain?: string;
  };
  status: {
    label: string;
    description: string;
    tone: SimpleDashboardTone;
  };
  metrics: {
    growthScore?: number;
    growthScoreLabel: string;
    opportunitiesCount: number;
    needsReviewCount: number;
  };
  nextBestAction?: {
    title: string;
    description: string;
    label: string;
    href?: string;
    apiAction?: string;
    tone?: "PRIMARY" | "SECONDARY";
  };
  secondaryAction?: {
    label: string;
    href?: string;
  };
  findings: Array<{
    title: string;
    description?: string;
    href?: string;
  }>;
  preparedForYou: {
    monthlyPlanStatus?: string;
    articleDraftsCount: number;
    socialPostsCount: number;
    emailApprovalsCount: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    summary?: string;
    href?: string;
  }>;
  billingNote?: string;
  showSetupBanner: boolean;
};

function mapTone(
  overall: AutopilotControlCenterViewModel["status"]["overall"],
  onboardingComplete: boolean
): SimpleDashboardTone {
  if (!onboardingComplete) {
    return "SETUP";
  }
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

function growthScoreLabel(score: number | undefined, hasAudit: boolean): string {
  if (score == null || !hasAudit) {
    return "Not enough data yet";
  }
  if (score >= 75) {
    return "Looking good";
  }
  if (score >= 50) {
    return "Room to grow";
  }
  return "Needs attention";
}

function actionButtonLabel(action: ControlCenterRecommendedAction): string {
  switch (action.type) {
    case "GENERATE_MONTHLY_PLAN":
      return "Open growth plan";
    case "GENERATE_EMAIL_APPROVAL":
    case "REVIEW_EMAIL":
      return "Review email";
    case "REVIEW_ARTICLE":
      return "View drafts";
    case "COPY_SOCIAL_POST":
      return "View posts";
    case "CONNECT_INTEGRATION":
      return "Connect GSC";
    case "RUN_AUDIT":
      return "Run audit";
    case "OPEN_TASK":
      return "View tasks";
    case "VIEW_TIMELINE":
      return "Open timeline";
    default:
      return "Open";
  }
}

function mapNextAction(
  action: ControlCenterRecommendedAction | undefined
): SimpleDashboardViewModel["nextBestAction"] {
  if (!action) {
    return undefined;
  }

  let title = action.title;
  let description = action.description;

  if (action.type === "GENERATE_MONTHLY_PLAN") {
    title = "Review your monthly growth plan";
    description =
      "RankBoost prepared a plan with SEO, content, and social actions for this month.";
  } else if (action.type === "RUN_AUDIT") {
    title = "Run your first audit";
    description =
      "RankBoost needs to scan your website before it can prepare actions.";
  } else if (action.type === "CONNECT_INTEGRATION") {
    title = "Connect Google Search Console";
    description =
      "Unlock real search queries and traffic opportunities.";
  } else if (action.type === "REVIEW_EMAIL") {
    title = "Review prepared email";
    description =
      "An approval email is ready. It will not be sent until you manually send it.";
  }

  return {
    title,
    description,
    label: actionButtonLabel(action),
    href: action.href,
    apiAction: action.apiAction,
    tone: "PRIMARY",
  };
}

function buildFindings(
  control: AutopilotControlCenterViewModel,
  opportunitiesCount: number
): SimpleDashboardViewModel["findings"] {
  const findings: SimpleDashboardViewModel["findings"] = [];

  if (control.metrics.openTasksCount > 0) {
    findings.push({
      title: `Your website has ${control.metrics.openTasksCount} SEO task${control.metrics.openTasksCount === 1 ? "" : "s"} waiting.`,
      href: "/app/autopilot-control",
    });
  }

  if (control.monthlyPlan && control.monthlyPlan.status !== "approved") {
    findings.push({
      title: "A monthly growth plan is ready for review.",
      href: control.monthlyPlan.href,
    });
  }

  const gsc = control.integrations.find((i) => i.key === "google_search_console");
  if (gsc && gsc.status !== "CONNECTED") {
    findings.push({
      title: "Google Search Console is not connected yet.",
      href: "/app/integrations",
    });
  }

  if (control.metrics.readySocialPostsCount > 0) {
    findings.push({
      title: `${control.metrics.readySocialPostsCount} social post draft${control.metrics.readySocialPostsCount === 1 ? " is" : "s are"} ready.`,
      href: "/app/social-posts",
    });
  }

  if (control.metrics.pendingEmailsCount > 0) {
    findings.push({
      title: `${control.metrics.pendingEmailsCount} email draft${control.metrics.pendingEmailsCount === 1 ? " is" : "s are"} waiting for review.`,
      href: "/app/email-approvals",
    });
  }

  if (opportunitiesCount > 0 && findings.length < 5) {
    findings.push({
      title: `RankBoost found ${opportunitiesCount} growth opportunit${opportunitiesCount === 1 ? "y" : "ies"}.`,
      href: "/app/autopilot-control",
    });
  }

  return findings.slice(0, 5);
}

function buildHeroStatus(
  control: AutopilotControlCenterViewModel,
  onboarding: OnboardingSummary
): SimpleDashboardViewModel["status"] {
  const onboardingComplete =
    onboarding.status === "COMPLETED" || onboarding.status === "SKIPPED";

  if (!control.website) {
    return {
      label: "Get started",
      description: "Add your website to start finding growth opportunities.",
      tone: "NO_DATA",
    };
  }

  if (!onboardingComplete) {
    return {
      label: "Finish setup",
      description:
        "Finish setup so RankBoost can prepare your first growth plan.",
      tone: "SETUP",
    };
  }

  if (!control.metrics.growthScore && control.status.overall === "NEEDS_SETUP") {
    return {
      label: "Run your first audit",
      description:
        "Run an audit so RankBoost can understand your website and prepare actions.",
      tone: "SETUP",
    };
  }

  const needsReview =
    control.approvalQueue.filter((q) => q.priority !== "LOW").length;

  if (needsReview > 0) {
    return {
      label: "Actions ready for you",
      description:
        "RankBoost found new opportunities and prepared actions for your review.",
      tone: "NEEDS_REVIEW",
    };
  }

  if (control.status.overall === "READY") {
    return {
      label: "Growth plan active",
      description:
        "Your growth plan is active. RankBoost is monitoring for new opportunities.",
      tone: "GOOD",
    };
  }

  return {
    label: control.status.label,
    description: control.status.description,
    tone: mapTone(control.status.overall, onboardingComplete),
  };
}

export function buildSimpleDashboardViewModel(input: {
  controlCenter: AutopilotControlCenterViewModel;
  onboarding: OnboardingSummary;
  opportunitiesCount?: number;
  subscriptionPlan?: string;
}): SimpleDashboardViewModel {
  const { controlCenter: control, onboarding } = input;
  const opportunitiesCount =
    input.opportunitiesCount ??
    control.metrics.openTasksCount +
      (control.metrics.highPriorityTasksCount > 0 ? 1 : 0);

  const needsReviewCount =
    control.metrics.pendingEmailsCount +
    control.metrics.draftArticlesCount +
    control.metrics.readySocialPostsCount +
    (control.monthlyPlan && control.monthlyPlan.status !== "approved" ? 1 : 0);

  const hasAudit = Boolean(control.metrics.growthScore != null);
  const primaryAction = control.recommendedActions[0];
  const secondaryAction =
    primaryAction?.type === "CONNECT_INTEGRATION"
      ? { label: "Do this later", href: "/app/integrations" }
      : onboarding.status !== "COMPLETED" && onboarding.status !== "SKIPPED"
        ? { label: "Open setup", href: "/app/onboarding" }
        : undefined;

  const status = buildHeroStatus(control, onboarding);

  let billingNote: string | undefined;
  if (input.subscriptionPlan === "free" || input.subscriptionPlan === "FREE") {
    billingNote =
      "You're on the Free plan. Upgrade when you need more growth actions.";
  }

  return {
    website: control.website ?? undefined,
    status,
    metrics: {
      growthScore: control.metrics.growthScore,
      growthScoreLabel: growthScoreLabel(control.metrics.growthScore, hasAudit),
      opportunitiesCount: Math.max(
        opportunitiesCount,
        control.metrics.openTasksCount
      ),
      needsReviewCount,
    },
    nextBestAction: mapNextAction(primaryAction),
    secondaryAction,
    findings: buildFindings(control, input.opportunitiesCount ?? 0),
    preparedForYou: {
      monthlyPlanStatus: control.monthlyPlan?.status,
      articleDraftsCount: control.metrics.draftArticlesCount,
      socialPostsCount: control.metrics.readySocialPostsCount,
      emailApprovalsCount: control.metrics.pendingEmailsCount,
    },
    recentActivity: control.recentActivity.slice(0, 3).map((event) => ({
      id: event.id,
      title: event.title,
      summary: event.summary,
      href: event.href ?? "/app/timeline",
    })),
    billingNote,
    showSetupBanner:
      onboarding.status !== "COMPLETED" && onboarding.status !== "SKIPPED",
  };
}

export async function getSimpleDashboardOverview(
  currentUser: CurrentUser,
  options?: { opportunitiesCount?: number; subscriptionPlan?: string }
): Promise<SimpleDashboardViewModel> {
  const [controlCenter, onboarding] = await Promise.all([
    getAutopilotControlCenter({ currentUser }),
    getOnboardingSummary(currentUser.id),
  ]);

  return buildSimpleDashboardViewModel({
    controlCenter,
    onboarding,
    opportunitiesCount: options?.opportunitiesCount,
    subscriptionPlan: options?.subscriptionPlan,
  });
}
