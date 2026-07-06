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

import {
  localizedBillingNote,
  localizedFindings,
  localizedGrowthScoreLabel,
  localizedHeroStatus,
  localizedNextAction,
  localizedSecondaryAction,
} from "./simple-overview-i18n";

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

export function buildSimpleDashboardViewModel(input: {
  controlCenter: AutopilotControlCenterViewModel;
  onboarding: OnboardingSummary;
  opportunitiesCount?: number;
  subscriptionPlan?: string;
  locale?: SaasLocale;
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
  const primaryAction = control.recommendedActions[0];
  const secondaryAction = localizedSecondaryAction(locale, {
    primaryType: primaryAction?.type,
    onboardingStatus: onboarding.status,
  });

  const status = localizedHeroStatus(locale, control, onboarding);

  const billingNote = localizedBillingNote(locale, input.subscriptionPlan);

  return {
    website: control.website ?? undefined,
    status,
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
    },
    nextBestAction: localizedNextAction(locale, primaryAction),
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
  const [controlCenter, onboarding] = await Promise.all([
    getAutopilotControlCenter({ currentUser, locale }),
    getOnboardingSummary(currentUser.id, locale),
  ]);

  return buildSimpleDashboardViewModel({
    controlCenter,
    onboarding,
    opportunitiesCount: options?.opportunitiesCount,
    subscriptionPlan: options?.subscriptionPlan,
    locale,
  });
}
