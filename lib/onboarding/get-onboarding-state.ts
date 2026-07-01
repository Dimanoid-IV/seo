import "server-only";

import type {
  OnboardingStatus,
  OnboardingStep,
  Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import {
  deriveOnboardingStatus,
  formatOnboardingViewModel,
  resolveCurrentStep,
  toOnboardingSummary,
} from "./format";
import {
  isLegacyOnboardingComplete,
  resolveOnboardingFacts,
} from "./resolve-onboarding";
import type { OnboardingSummary, OnboardingViewModel } from "./types";
import {
  ensureOnboardingState,
  markUserOnboardingCompleted,
  patchOnboardingState,
} from "./update-onboarding-state";

function websiteRelation(
  websiteId?: string | null
): Prisma.OnboardingStateUpdateInput["website"] {
  if (websiteId) {
    return { connect: { id: websiteId } };
  }
  return { disconnect: true };
}

async function syncOnboardingFromFacts(userId: string) {
  const facts = await resolveOnboardingFacts(userId);
  const state = await ensureOnboardingState(userId);
  const now = new Date();

  if (isLegacyOnboardingComplete(facts) && state.status !== "COMPLETED") {
    await markUserOnboardingCompleted(userId);
    await patchOnboardingState({
      userId,
      data: {
        status: "COMPLETED" satisfies OnboardingStatus,
        currentStep: "COMPLETE" satisfies OnboardingStep,
        website: websiteRelation(facts.website?.id),
        addWebsiteCompletedAt: facts.website ? now : undefined,
        firstAuditCompletedAt: facts.hasCompletedAudit ? now : undefined,
        gscStepCompletedAt:
          facts.gscConnected || facts.gscSkipped ? now : undefined,
        firstPlanGeneratedAt: facts.hasMonthlyPlan ? now : undefined,
        completedAt: now,
      },
    });
    return { facts, stateUpdated: true };
  }

  const patch: Prisma.OnboardingStateUpdateInput = {
    website: websiteRelation(facts.website?.id),
  };

  if (facts.website && !state.addWebsiteCompletedAt) {
    patch.addWebsiteCompletedAt = now;
  }
  if (facts.hasCompletedAudit && !state.firstAuditCompletedAt) {
    patch.firstAuditCompletedAt = now;
  }
  if ((facts.gscConnected || facts.gscSkipped) && !state.gscStepCompletedAt) {
    patch.gscStepCompletedAt = now;
    if (facts.gscSkipped) {
      patch.metadata = { gscSkipped: true };
    }
  }
  if (facts.hasMonthlyPlan && !state.firstPlanGeneratedAt) {
    patch.firstPlanGeneratedAt = now;
  }

  const currentStep = resolveCurrentStep(facts);
  const status =
    state.status === "SKIPPED"
      ? "SKIPPED"
      : state.status === "COMPLETED"
        ? "COMPLETED"
        : currentStep === "COMPLETE"
          ? "IN_PROGRESS"
          : state.status === "NOT_STARTED" && facts.website
            ? "IN_PROGRESS"
            : state.status;

  patch.currentStep = currentStep;
  patch.status = status;

  if (Object.keys(patch).length > 0) {
    await patchOnboardingState({ userId, data: patch });
  }

  return { facts, stateUpdated: false };
}

export async function getOnboardingState(userId: string): Promise<OnboardingViewModel> {
  await syncOnboardingFromFacts(userId);

  const prisma = getPrisma();
  const facts = await resolveOnboardingFacts(userId);
  const state = await prisma.onboardingState.findUnique({
    where: { userId },
  });

  const status = deriveOnboardingStatus({
    storedStatus: state?.status ?? "NOT_STARTED",
    facts,
    skippedAt: state?.skippedAt ?? null,
    completedAt: state?.completedAt ?? null,
  });

  const currentStep =
    status === "COMPLETED" || status === "SKIPPED"
      ? "COMPLETE"
      : resolveCurrentStep(facts);

  return formatOnboardingViewModel({
    facts,
    status,
    currentStep,
  });
}

export async function getOnboardingSummary(userId: string): Promise<OnboardingSummary> {
  const viewModel = await getOnboardingState(userId);
  return toOnboardingSummary(viewModel);
}

export async function skipOnboarding(userId: string) {
  const facts = await resolveOnboardingFacts(userId);
  const now = new Date();

  await patchOnboardingState({
    userId,
    data: {
      status: "SKIPPED",
      skippedAt: now,
      website: websiteRelation(facts.website?.id),
    },
  });

  return getOnboardingState(userId);
}

export async function completeOnboarding(userId: string) {
  const facts = await resolveOnboardingFacts(userId);

  if (!facts.website || !facts.hasCompletedAudit) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Finish the setup steps before completing onboarding."
    );
  }

  if (!facts.hasMonthlyPlan) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Generate your first monthly growth plan before completing setup."
    );
  }

  await markUserOnboardingCompleted(userId);

  const { timelineAfterOnboardingCompleted } = await import("./hooks");
  try {
    await timelineAfterOnboardingCompleted({
      userId,
      websiteId: facts.website.id,
    });
  } catch {
    // Timeline must not block completion.
  }

  return getOnboardingState(userId);
}
