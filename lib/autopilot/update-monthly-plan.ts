import "server-only";

import { MonthlyAutopilotStatus, type Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { formatMonthlyAutopilotPlan } from "./format";
import { timelineAfterMonthlyAutopilotPlanApproved } from "./hooks";
import { findAutopilotPlanForUser } from "./resolve-website";
import type {
  AutopilotFocusArea,
  AutopilotNextStep,
  AutopilotRecommendedAction,
} from "./types";

export async function updateMonthlyAutopilotPlan(input: {
  planId: string;
  userId: string;
  data: {
    title?: string;
    summary?: string;
    status?: MonthlyAutopilotStatus;
    focusAreas?: AutopilotFocusArea[];
    recommendedActions?: AutopilotRecommendedAction[];
    nextSteps?: AutopilotNextStep[];
  };
}) {
  const existing = await findAutopilotPlanForUser(input.planId, input.userId);

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, "Monthly plan not found");
  }

  if (input.data.status === MonthlyAutopilotStatus.ARCHIVED) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Use archive endpoint to archive plans."
    );
  }

  const prisma = getPrisma();
  const wasApproved =
    input.data.status === MonthlyAutopilotStatus.APPROVED &&
    existing.status !== MonthlyAutopilotStatus.APPROVED;

  const updated = await prisma.monthlyAutopilotPlan.update({
    where: { id: existing.id },
    data: {
      title: input.data.title?.trim() || undefined,
      summary: input.data.summary === undefined ? undefined : input.data.summary,
      status: input.data.status,
      focusAreasJson: input.data.focusAreas
        ? (input.data.focusAreas as Prisma.InputJsonValue)
        : undefined,
      recommendationsJson: input.data.recommendedActions
        ? (input.data.recommendedActions as Prisma.InputJsonValue)
        : undefined,
      nextActionsJson: input.data.nextSteps
        ? (input.data.nextSteps as Prisma.InputJsonValue)
        : undefined,
      approvedAt:
        input.data.status === MonthlyAutopilotStatus.APPROVED
          ? new Date()
          : undefined,
    },
  });

  if (wasApproved) {
    try {
      await timelineAfterMonthlyAutopilotPlanApproved({
        userId: input.userId,
        websiteId: existing.websiteId,
        planId: existing.id,
        month: existing.month,
      });
    } catch {
      // Timeline must not block approval.
    }
  }

  return formatMonthlyAutopilotPlan(updated);
}

export async function archiveMonthlyAutopilotPlan(input: {
  planId: string;
  userId: string;
}) {
  const existing = await findAutopilotPlanForUser(input.planId, input.userId);

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, "Monthly plan not found");
  }

  const prisma = getPrisma();

  const updated = await prisma.monthlyAutopilotPlan.update({
    where: { id: existing.id },
    data: {
      status: MonthlyAutopilotStatus.ARCHIVED,
      archivedAt: new Date(),
    },
  });

  return formatMonthlyAutopilotPlan(updated);
}
