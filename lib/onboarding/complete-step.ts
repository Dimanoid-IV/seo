import "server-only";

import type { OnboardingStep, Prisma } from "@prisma/client";

import { AppError, ErrorCode } from "@/lib/errors";

import { resolveOnboardingFacts } from "./resolve-onboarding";
import { patchOnboardingState } from "./update-onboarding-state";

export type OnboardingStepAction = "COMPLETE" | "SKIP" | "VIEWED";

function stepTimestampField(
  step: OnboardingStep
): keyof Pick<
  import("@prisma/client").OnboardingState,
  | "addWebsiteCompletedAt"
  | "firstAuditCompletedAt"
  | "gscStepCompletedAt"
  | "growthScoreViewedAt"
  | "firstTasksViewedAt"
  | "firstPlanGeneratedAt"
> | null {
  switch (step) {
    case "ADD_WEBSITE":
      return "addWebsiteCompletedAt";
    case "RUN_AUDIT":
      return "firstAuditCompletedAt";
    case "CONNECT_GSC":
      return "gscStepCompletedAt";
    case "REVIEW_RESULTS":
      return "growthScoreViewedAt";
    case "GENERATE_PLAN":
      return "firstPlanGeneratedAt";
    default:
      return null;
  }
}

function assertStepCanComplete(
  step: OnboardingStep,
  action: OnboardingStepAction,
  facts: Awaited<ReturnType<typeof resolveOnboardingFacts>>
) {
  switch (step) {
    case "ADD_WEBSITE":
      if (!facts.website) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Add your website before completing this step."
        );
      }
      break;
    case "RUN_AUDIT":
      if (!facts.hasCompletedAudit) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Run your first audit before completing this step."
        );
      }
      break;
    case "CONNECT_GSC":
      if (action !== "SKIP" && !facts.gscConnected) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Connect Google Search Console or skip this optional step."
        );
      }
      break;
    case "REVIEW_RESULTS":
      if (!facts.hasCompletedAudit) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Complete an audit before reviewing results."
        );
      }
      break;
    case "GENERATE_PLAN":
      if (!facts.hasMonthlyPlan) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Generate your monthly growth plan before completing this step."
        );
      }
      break;
    default:
      break;
  }
}

export async function applyOnboardingStepAction(input: {
  userId: string;
  step: OnboardingStep;
  action: OnboardingStepAction;
}) {
  const facts = await resolveOnboardingFacts(input.userId);
  const now = new Date();
  const timestampField = stepTimestampField(input.step);

  if (input.action === "SKIP" && input.step !== "CONNECT_GSC") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Only the Search Console step can be skipped."
    );
  }

  if (input.action !== "SKIP") {
    assertStepCanComplete(input.step, input.action, facts);
  }

  const data: Prisma.OnboardingStateUpdateInput = {
    status: "IN_PROGRESS",
    website: facts.website?.id ? { connect: { id: facts.website.id } } : undefined,
  };

  if (timestampField) {
    data[timestampField] = now;
  }

  if (input.step === "CONNECT_GSC" && input.action === "SKIP") {
    data.gscStepCompletedAt = now;
    data.metadata = { gscSkipped: true };
  }

  if (input.step === "REVIEW_RESULTS" && input.action === "VIEWED") {
    data.growthScoreViewedAt = now;
    data.firstTasksViewedAt = now;
  }

  return patchOnboardingState({
    userId: input.userId,
    data,
  });
}
