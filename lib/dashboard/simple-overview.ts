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
  resolveDashboardPublishingState,
} from "./primary-cta";
import { publishingPathChip } from "@/lib/autopilot/human-pipeline-labels";
import { getActivationStateForUser } from "@/lib/onboarding/activation-state";
import type { ActivationState } from "@/lib/onboarding/activation-types";
import { readSiteTechFromBusinessGoals } from "@/lib/onboarding/site-tech-persist";
import { readBrandVoiceFromBusinessGoals } from "@/lib/brand-voice/business-goals";
import { getPrisma } from "@/lib/db";
import { WebsiteStatus } from "@prisma/client";
import {
  buildDashboardAiVisibilitySummary,
  type DashboardAiVisibilitySummary,
} from "./ai-visibility-summary";

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
  monthlyPlanPreview?: {
    status?: string;
    href: string;
    articleTopics: Array<{
      id: string;
      title: string;
      reason?: string;
      status: string;
      scheduledFor?: string | null;
    }>;
    fixItems: Array<{
      id: string;
      title: string;
      status: string;
    }>;
    totalItems: number;
    isApproved: boolean;
  };
  aiVisibility?: DashboardAiVisibilitySummary;
  /** Prompt 11.44 — human-facing monthly autopilot status when plan is approved. */
  monthlyAutopilotActive?: {
    nextArticleDateLabel: string | null;
    readyForReviewCount: number;
    publishingPath: "manual" | "wordpress_draft" | "wordpress_live" | "webhook_ready";
    primaryHref: string;
    primaryLabelKind: "review" | "plan";
    showPublishingNudge: boolean;
  };
  readyToPublish?: {
    id: string;
    title: string;
    href: string;
    publishingPath: "manual" | "wordpress_draft" | "wordpress_live" | "webhook_ready";
    siteLabel: string;
  };
  /** Prompt 11.46 — first website activation progress */
  activation?: {
    state: ActivationState | null;
    siteTechPlatform: string | null;
    brandVoiceReady: boolean;
    preparingAnalysis: boolean;
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
  activation?: SimpleDashboardViewModel["activation"];
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
  const publishingState = resolveDashboardPublishingState(control.integrations);
  const gscNeedsProperty = gscIntegration?.status === "NEEDS_SETUP";
  const publishingConfigured = publishingState.configured;

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

  const planApproved = planHasApprovedArticleTopics({
    monthlyPlanStatus: control.monthlyPlan?.status,
    planItemTypes: control.monthlyPlan?.hasArticleTopics ? ["ARTICLE"] : [],
  });
  const planPreviewItems = control.monthlyPlan?.previewItems ?? [];
  const monthlyPlanPreview = control.monthlyPlan
    ? {
        status: control.monthlyPlan.status,
        href: control.monthlyPlan.href,
        articleTopics: planPreviewItems
          .filter((item) => item.type === "ARTICLE")
          .slice(0, 3)
          .map((item) => ({
            id: item.id,
            title: item.title,
            reason: item.reason,
            status: item.status,
            scheduledFor: item.scheduledFor,
          })),
        fixItems: planPreviewItems
          .filter((item) => item.type === "SEO_FIX" || item.type === "TASK_FIX")
          .slice(0, 3)
          .map((item) => ({
            id: item.id,
            title: item.title,
            status: item.status,
          })),
        totalItems: planPreviewItems.length,
        isApproved: planApproved,
      }
    : undefined;
  const aiVisibility = buildDashboardAiVisibilitySummary({
    snapshot: control.monthlyPlan?.aiVisibility,
    href: control.monthlyPlan?.href ?? "/app/autopilot",
  });

  const reviewCount = input.reviewQueueCount ?? needsReviewCount;
  const publishChip = publishingPathChip(publishingState.publishPath);
  const readyArticle = control.approvalQueue.find(
    (item) => item.type === "ARTICLE" || item.type === "WORDPRESS_DRAFT"
  );

  let nextArticleDateLabel: string | null = null;
  if (control.monthlyPlan?.nextScheduledArticleAt) {
    nextArticleDateLabel = new Date(
      control.monthlyPlan.nextScheduledArticleAt
    ).toLocaleDateString(
      locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    );
  }

  const monthlyAutopilotActive = planApproved
    ? {
        nextArticleDateLabel,
        readyForReviewCount: Math.max(
          reviewCount,
          control.monthlyPlan?.readyToPublishCount ?? 0
        ),
        publishingPath: publishChip,
        primaryHref: reviewCount > 0 ? "/app/review" : "/app/autopilot",
        primaryLabelKind: (reviewCount > 0 ? "review" : "plan") as
          | "review"
          | "plan",
        showPublishingNudge: !publishingConfigured,
      }
    : undefined;

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
      reviewQueueCount: reviewCount,
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
    monthlyPlanPreview,
    aiVisibility,
    monthlyAutopilotActive,
    readyToPublish: readyArticle?.href
      ? {
          id: readyArticle.id,
          title: readyArticle.title,
          href: readyArticle.href,
          publishingPath: publishChip,
          siteLabel:
            control.website?.domain ?? control.website?.name ?? "your site",
        }
      : undefined,
    activation: input.activation,
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
  const [controlCenter, onboarding, reviewQueueCount, activationState] =
    await Promise.all([
      getAutopilotControlCenter({ currentUser, locale }),
      getOnboardingSummary(currentUser.id, locale),
      getReviewQueueCount(currentUser),
      getActivationStateForUser(currentUser.id),
    ]);

  let gsc: SimpleDashboardViewModel["gsc"];
  if (controlCenter.website?.id) {
    const gscData = await loadDashboardGoogleSearchConsole(
      controlCenter.website.id
    );
    gsc = {
      connected: gscData.connected,
      connectHref: "/app/integrations",
      selectedProperty: gscData.selectedProperty,
      metricsSummary: gscData.metricsSummary,
    };
  }

  let activation: SimpleDashboardViewModel["activation"];
  if (controlCenter.website?.id) {
    const prisma = getPrisma();
    const website = await prisma.website.findFirst({
      where: {
        id: controlCenter.website.id,
        deletedAt: null,
        status: WebsiteStatus.ACTIVE,
      },
      select: { businessGoals: true },
    });
    const siteTech = readSiteTechFromBusinessGoals(website?.businessGoals);
    const brandVoice = readBrandVoiceFromBusinessGoals(website?.businessGoals);
    const preparingAnalysis =
      activationState?.status === "running" ||
      (!controlCenter.metrics.growthScore &&
        activationState?.status !== "failed");
    activation = {
      state: activationState,
      siteTechPlatform: siteTech?.platform ?? null,
      brandVoiceReady: Boolean(brandVoice),
      preparingAnalysis: Boolean(preparingAnalysis),
    };
  }

  const viewModel = buildSimpleDashboardViewModel({
    controlCenter,
    onboarding,
    opportunitiesCount: options?.opportunitiesCount,
    subscriptionPlan: options?.subscriptionPlan,
    locale,
    reviewQueueCount,
    activation,
  });

  return { ...viewModel, gsc };
}
