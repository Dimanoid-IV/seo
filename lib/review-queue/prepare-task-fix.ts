import "server-only";

import { TaskStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { DEFAULT_SAAS_LOCALE } from "@/lib/i18n/saas/locales";
import { generatePreparedFixForTask } from "@/lib/review-queue/generate-prepared-fix";
import {
  mergePreparedFixIntoRecommendation,
  parseTaskRecommendationWithFix,
} from "@/lib/tasks/prepared-fix";

const TASK_SELECT = {
  id: true,
  websiteId: true,
  organizationId: true,
  title: true,
  description: true,
  category: true,
  priority: true,
  source: true,
  status: true,
  recommendationJson: true,
} as const;

export async function prepareTaskFix(input: {
  taskId: string;
  currentUser: CurrentUser;
  locale?: SaasLocale;
  regenerate?: boolean;
}) {
  const prisma = getPrisma();
  const locale = input.locale ?? DEFAULT_SAAS_LOCALE;

  const task = await prisma.task.findFirst({
    where: {
      id: input.taskId,
      deletedAt: null,
      organization: {
        ownerUserId: input.currentUser.id,
        deletedAt: null,
      },
    },
    select: TASK_SELECT,
  });

  if (!task) {
    throw new AppError(ErrorCode.NOT_FOUND, "Task not found");
  }

  const parsed = parseTaskRecommendationWithFix(task.recommendationJson);
  if (
    parsed.preparedFix?.status === "AWAITING_REVIEW" &&
    !input.regenerate
  ) {
    return {
      taskId: task.id,
      preparedFix: parsed.preparedFix,
      alreadyPrepared: true,
      hermesUsed: parsed.preparedFix.generatedBy === "HERMES",
      fallbackUsed: parsed.preparedFix.fallbackUsed,
      hermesUnavailable: false,
    };
  }

  const generation = await generatePreparedFixForTask({
    taskId: task.id,
    taskTitle: task.title,
    taskDescription: task.description,
    taskCategory: task.category,
    taskPriority: task.priority,
    taskSource: task.source,
    recommendationJson: task.recommendationJson,
    websiteId: task.websiteId,
    organizationId: task.organizationId,
    userId: input.currentUser.id,
    locale,
  });

  const recommendationJson = mergePreparedFixIntoRecommendation(
    task.recommendationJson,
    generation.preparedFix
  );

  await prisma.task.update({
    where: { id: task.id },
    data: {
      recommendationJson: recommendationJson as Prisma.InputJsonValue,
      status:
        task.status === TaskStatus.COMPLETED ||
        task.status === TaskStatus.DISMISSED
          ? task.status
          : TaskStatus.WAITING_REVIEW,
    },
  });

  return {
    taskId: task.id,
    preparedFix: generation.preparedFix,
    alreadyPrepared: false,
    hermesUsed: generation.hermesUsed,
    fallbackUsed: generation.fallbackUsed,
    hermesUnavailable: generation.hermesUnavailable,
  };
}
