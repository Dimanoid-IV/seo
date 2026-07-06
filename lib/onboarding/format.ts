import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { DEFAULT_SAAS_LOCALE } from "@/lib/i18n/saas/locales";
import { getSaasDictionary } from "@/lib/i18n/saas";
import { checkUsageLimit } from "@/lib/billing/usage";
import { getCurrentSubscription } from "@/lib/billing/get-subscription";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";

import type {
  OnboardingFacts,
  OnboardingStepKey,
  OnboardingStepStatus,
  OnboardingStepViewModel,
  OnboardingSummary,
  OnboardingViewModel,
} from "./types";
import { ONBOARDING_PROGRESS_STEPS as PROGRESS_STEPS } from "./types";

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function isStepDone(step: OnboardingStepKey, facts: OnboardingFacts): boolean {
  switch (step) {
    case "ADD_WEBSITE":
      return Boolean(facts.website);
    case "RUN_AUDIT":
      return facts.hasCompletedAudit;
    case "CONNECT_GSC":
      return facts.gscConnected || facts.gscSkipped;
    case "REVIEW_RESULTS":
      return facts.resultsViewed;
    case "GENERATE_PLAN":
      return facts.hasMonthlyPlan;
    default:
      return false;
  }
}

function isStepSkipped(step: OnboardingStepKey, facts: OnboardingFacts): boolean {
  return step === "CONNECT_GSC" && facts.gscSkipped && !facts.gscConnected;
}

export function resolveCurrentStep(facts: OnboardingFacts): OnboardingStepKey {
  if (!facts.website) return "ADD_WEBSITE";
  if (!facts.hasCompletedAudit) return "RUN_AUDIT";
  if (!facts.gscConnected && !facts.gscSkipped) return "CONNECT_GSC";
  if (!facts.resultsViewed) return "REVIEW_RESULTS";
  if (!facts.hasMonthlyPlan) return "GENERATE_PLAN";
  return "COMPLETE";
}

function buildStepDefinitions(
  locale: SaasLocale = DEFAULT_SAAS_LOCALE
): Array<Omit<OnboardingStepViewModel, "status">> {
  const steps = getSaasDictionary(locale).onboarding.steps;
  return [
    {
      key: "ADD_WEBSITE",
      title: steps.addWebsite.title,
      description: steps.addWebsite.description,
      actionLabel: steps.addWebsite.action,
    },
    {
      key: "RUN_AUDIT",
      title: steps.runAudit.title,
      description: steps.runAudit.description,
      actionLabel: steps.runAudit.action,
      apiAction: "run_audit",
    },
    {
      key: "CONNECT_GSC",
      title: steps.connectGsc.title,
      description: steps.connectGsc.description,
      href: "/app/integrations",
      actionLabel: steps.connectGsc.action,
      optional: true,
    },
    {
      key: "REVIEW_RESULTS",
      title: steps.reviewResults.title,
      description: steps.reviewResults.description,
      href: "/app/autopilot-control",
      actionLabel: steps.reviewResults.action,
      apiAction: "mark_viewed",
    },
    {
      key: "GENERATE_PLAN",
      title: steps.generatePlan.title,
      description: steps.generatePlan.description,
      actionLabel: steps.generatePlan.action,
      apiAction: "generate_plan",
    },
  ];
}

function buildStepStatus(
  step: OnboardingStepKey,
  currentStep: OnboardingStepKey,
  facts: OnboardingFacts
): OnboardingStepStatus {
  if (isStepSkipped(step, facts)) {
    return "SKIPPED";
  }
  if (isStepDone(step, facts)) {
    return "DONE";
  }
  if (step === currentStep) {
    return step === "CONNECT_GSC" ? "OPTIONAL" : "CURRENT";
  }

  const stepIndex = PROGRESS_STEPS.indexOf(step);
  const currentIndex = PROGRESS_STEPS.indexOf(
    currentStep === "COMPLETE" ? "GENERATE_PLAN" : currentStep
  );

  if (stepIndex > currentIndex) {
    return "LOCKED";
  }

  return "CURRENT";
}

function computeProgress(facts: OnboardingFacts, currentStep: OnboardingStepKey) {
  const total = PROGRESS_STEPS.length;
  let completed = 0;

  for (const step of PROGRESS_STEPS) {
    if (isStepDone(step, facts)) {
      completed += 1;
    }
  }

  if (currentStep === "COMPLETE") {
    completed = total;
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

export async function formatOnboardingViewModel(input: {
  facts: OnboardingFacts;
  status: OnboardingViewModel["status"];
  currentStep: OnboardingStepKey;
  locale?: SaasLocale;
}): Promise<OnboardingViewModel> {
  const locale = input.locale ?? DEFAULT_SAAS_LOCALE;
  const { facts, status } = input;
  const currentStep = input.currentStep;
  const progress = computeProgress(facts, currentStep);

  let opportunitiesCount = facts.opportunitiesCount;
  if (facts.website && facts.hasCompletedAudit && facts.organizationId) {
    try {
      const opportunities = await syncGrowthOpportunitiesForWebsite({
        websiteId: facts.website.id,
        organizationId: facts.organizationId,
        userId: facts.userId,
      });
      opportunitiesCount = opportunities.length;
    } catch {
      opportunitiesCount = facts.opportunitiesCount;
    }
  }

  const billingLimits: NonNullable<OnboardingViewModel["billing"]>["limits"] = [];
  let upgradeRecommended = false;
  let planLabel = "free";

  if (facts.organizationId) {
    try {
      const subscription = await getCurrentSubscription({
        userId: facts.userId,
        organizationId: facts.organizationId,
      });
      planLabel = subscription.planKey.toLowerCase();

      const auditLimit = await checkUsageLimit({
        userId: facts.userId,
        organizationId: facts.organizationId,
        websiteId: facts.website?.id,
        key: "AUDIT_RUN",
      });
      const planLimit = await checkUsageLimit({
        userId: facts.userId,
        organizationId: facts.organizationId,
        websiteId: facts.website?.id,
        key: "MONTHLY_AUTOPILOT",
      });

      billingLimits.push(
        {
          key: "audit_run",
          current: auditLimit.current,
          limit: auditLimit.limit,
          reached: !auditLimit.allowed,
        },
        {
          key: "monthly_autopilot",
          current: planLimit.current,
          limit: planLimit.limit,
          reached: !planLimit.allowed,
        }
      );

      upgradeRecommended = billingLimits.some((item) => item.reached);
    } catch {
      // Billing must not block onboarding rendering.
    }
  }

  const steps = buildStepDefinitions(locale).map((step) => ({
    ...step,
    status: buildStepStatus(step.key, currentStep, facts),
  }));

  const shouldShowSetup =
    status === "NOT_STARTED" || status === "IN_PROGRESS";

  return {
    status,
    currentStep,
    website: facts.website
      ? {
          id: facts.website.id,
          domain: extractDomain(facts.website.url),
          name: facts.website.displayName ?? undefined,
        }
      : undefined,
    progress,
    steps,
    results: facts.website
      ? {
          growthScore: facts.website.currentGrowthScore ?? undefined,
          tasksCount: facts.openTasksCount,
          opportunitiesCount,
          monthlyPlanStatus: facts.monthlyPlanStatus ?? undefined,
        }
      : undefined,
    billing: {
      plan: planLabel,
      limits: billingLimits,
      upgradeRecommended,
    },
    shouldShowSetup,
  };
}

export function toOnboardingSummary(
  viewModel: OnboardingViewModel
): OnboardingSummary {
  return {
    status: viewModel.status,
    currentStep: viewModel.currentStep,
    progressPercentage: viewModel.progress.percentage,
    shouldShowSetup: viewModel.shouldShowSetup,
  };
}

export function deriveOnboardingStatus(input: {
  storedStatus: string;
  facts: OnboardingFacts;
  skippedAt: Date | null;
  completedAt: Date | null;
}): OnboardingViewModel["status"] {
  if (input.completedAt || input.facts.onboardingCompletedAt) {
    return "COMPLETED";
  }
  if (input.skippedAt || input.storedStatus === "SKIPPED") {
    return "SKIPPED";
  }
  if (input.storedStatus === "COMPLETED") {
    return "COMPLETED";
  }
  if (
    input.storedStatus === "NOT_STARTED" &&
    !input.facts.website &&
    !input.facts.hasCompletedAudit
  ) {
    return "NOT_STARTED";
  }
  return "IN_PROGRESS";
}

export { PROGRESS_STEPS as ONBOARDING_PROGRESS_STEPS };
