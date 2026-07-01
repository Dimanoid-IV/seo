export type OnboardingStatusKey =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED";

export type OnboardingStepKey =
  | "ADD_WEBSITE"
  | "RUN_AUDIT"
  | "CONNECT_GSC"
  | "REVIEW_RESULTS"
  | "GENERATE_PLAN"
  | "COMPLETE";

export type OnboardingStepStatus =
  | "DONE"
  | "CURRENT"
  | "LOCKED"
  | "OPTIONAL"
  | "SKIPPED";

export type OnboardingStepViewModel = {
  key: OnboardingStepKey;
  title: string;
  description: string;
  status: OnboardingStepStatus;
  href?: string;
  actionLabel?: string;
  apiAction?: string;
  optional?: boolean;
};

export type OnboardingViewModel = {
  status: OnboardingStatusKey;
  currentStep: OnboardingStepKey;
  website?: {
    id: string;
    domain: string;
    name?: string;
  };
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  steps: OnboardingStepViewModel[];
  results?: {
    growthScore?: number;
    tasksCount?: number;
    opportunitiesCount?: number;
    monthlyPlanStatus?: string;
  };
  billing?: {
    plan: string;
    limits: Array<{
      key: string;
      current: number;
      limit: number | null;
      reached: boolean;
    }>;
    upgradeRecommended: boolean;
  };
  shouldShowSetup: boolean;
};

export type OnboardingSummary = {
  status: OnboardingStatusKey;
  currentStep: OnboardingStepKey;
  progressPercentage: number;
  shouldShowSetup: boolean;
};

export type OnboardingFacts = {
  userId: string;
  organizationId: string | null;
  onboardingCompletedAt: Date | null;
  website: {
    id: string;
    url: string;
    displayName: string | null;
    currentGrowthScore: number | null;
  } | null;
  hasCompletedAudit: boolean;
  gscConnected: boolean;
  gscSkipped: boolean;
  resultsViewed: boolean;
  openTasksCount: number;
  opportunitiesCount: number;
  hasMonthlyPlan: boolean;
  monthlyPlanStatus: string | null;
};

export const ONBOARDING_PROGRESS_STEPS: OnboardingStepKey[] = [
  "ADD_WEBSITE",
  "RUN_AUDIT",
  "CONNECT_GSC",
  "REVIEW_RESULTS",
  "GENERATE_PLAN",
];
