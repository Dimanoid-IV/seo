import "server-only";

import type { CurrentUser } from "@/lib/auth/types";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { DEFAULT_SAAS_LOCALE } from "@/lib/i18n/saas/locales";
import { getAutopilotControlCenter } from "@/lib/autopilot-control/get-control-center";
import type {
  AutopilotControlCenterViewModel,
} from "@/lib/autopilot-control/types";
import { getOnboardingSummary } from "@/lib/onboarding/get-onboarding-state";
import type { OnboardingSummary } from "@/lib/onboarding/types";
import { getReviewQueueCount } from "@/lib/review-queue/list-review-queue";

import { loadDashboardGoogleSearchConsole } from "./gsc-overview";

import {
  localizedBillingNote,
  localizedFindings,
  localizedGrowthScoreLabel,
  localizedHeroStatus,
  localizedPrimaryCta,
  localizedSecondaryAction,
} from "./simple-overview-i18n";
import {
  planHasApprovedArticleTopics,
  resolveDashboardPrimaryCta,
} from "./primary-cta";

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
  /** True once the site has at least one completed audit (growth score exists). */
  hasAudit: boolean;
  metrics: {
    growthScore?: number;
    growthScoreLabel: string;
    opportunitiesCount: number;
    needsReviewCount: number;
    reviewQueueCount: number;
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
  gsc?: {
    connected: boolean;
    connectHref: string;
    selectedProperty?: string | null;
    metricsSummary?: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    } | null;
  };
};

export function buildSimpleDashboardViewModel(input: {
  controlCenter: AutopilotControlCenterViewModel;
  onboarding: OnboardingSummary;
  opportunitiesCount?: number;
  subscriptionPlan?: string;
  locale?: SaasLocale;
  reviewQueueCount?: number;
}): SimpleDashboardViewModel {
  const { controlCenter: control, onboarding } = input;
  const locale = input.locale ?? DEFAULT_SAAS_LOCALE;
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
  const gscIntegration = control.integrations.find(
    (i) => i.key === "google_search_console"
  );
  const wordpressIntegration = control.integrations.find(
    (i) => i.key === "wordpress"
  );
  const gscNeedsProperty = gscIntegration?.status === "NEEDS_SETUP";
  const publishingConfigured = wordpressIntegration?.status === "CONNECTED";

  const primaryDecision = resolveDashboardPrimaryCta({
    hasAudit,
    reviewQueueCount: input.reviewQueueCount ?? 0,
    readyToPublishCount: control.monthlyPlan?.readyToPublishCount ?? 0,
    hasPendingPlanApproval: Boolean(
      control.monthlyPlan &&
        control.monthlyPlan.status !== "approved" &&
        control.monthlyPlan.hasArticleTopics
    ),
    hasApprovedPlanWithArticleTopics: planHasApprovedArticleTopics({
      monthlyPlanStatus: control.monthlyPlan?.status,
      planItemTypes: control.monthlyPlan?.hasArticleTopics
        ? ["ARTICLE"]
        : [],
    }),
    nextScheduledArticleAt: control.monthlyPlan?.nextScheduledArticleAt ?? null,
    gscNeedsProperty,
    publishingConfigured,
  });

  const secondaryAction = localizedSecondaryAction(locale, {
    primaryType: primaryDecision.kind,
    onboardingStatus: onboarding.status,
  });

  const status = localizedHeroStatus(locale, control, onboarding);

  const billingNote = localizedBillingNote(locale, input.subscriptionPlan);

  return {
    website: control.website ?? undefined,
    status,
    hasAudit,
    metrics: {
      growthScore: control.metrics.growthScore,
      growthScoreLabel: localizedGrowthScoreLabel(
        locale,
        control.metrics.growthScore,
        hasAudit
      ),
      opportunitiesCount: Math.max(
        opportunitiesCount,
        control.metrics.openTasksCount
      ),
      needsReviewCount,
      reviewQueueCount: input.reviewQueueCount ?? needsReviewCount,
    },
    nextBestAction: localizedPrimaryCta(locale, primaryDecision),
    secondaryAction,
    findings: localizedFindings(
      locale,
      control,
      input.opportunitiesCount ?? 0
    ),
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
  options?: {
    opportunitiesCount?: number;
    subscriptionPlan?: string;
    locale?: SaasLocale;
  }
): Promise<SimpleDashboardViewModel> {
  const locale = options?.locale ?? DEFAULT_SAAS_LOCALE;
  const [controlCenter, onboarding, reviewQueueCount] = await Promise.all([
    getAutopilotControlCenter({ currentUser, locale }),
    getOnboardingSummary(currentUser.id, locale),
    getReviewQueueCount(currentUser),
  ]);

  let gsc: SimpleDashboardViewModel["gsc"];
  if (controlCenter.website?.id) {
    const gscData = await loadDashboardGoogleSearchConsole(controlCenter.website.id);
    gsc = {
      connected: gscData.connected,
      connectHref: "/app/integrations",
      selectedProperty: gscData.selectedProperty,
      metricsSummary: gscData.metricsSummary,
    };
  }

  const viewModel = buildSimpleDashboardViewModel({
    controlCenter,
    onboarding,
    opportunitiesCount: options?.opportunitiesCount,
    subscriptionPlan: options?.subscriptionPlan,
    locale,
    reviewQueueCount,
  });

  return { ...viewModel, gsc };
}
