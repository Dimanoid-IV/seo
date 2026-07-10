import "server-only";

import { TaskStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  buildPreparedFixForTask,
  mergePreparedFixIntoRecommendation,
  parseTaskRecommendationWithFix,
} from "@/lib/tasks/prepared-fix";

const TASK_SELECT = {
  id: true,
  websiteId: true,
  organizationId: true,
  title: true,
  status: true,
  recommendationJson: true,
} as const;

export async function prepareTaskFix(input: {
  taskId: string;
  currentUser: CurrentUser;
}) {
  const prisma = getPrisma();

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
  if (parsed.preparedFix?.status === "AWAITING_REVIEW") {
    return {
      taskId: task.id,
      preparedFix: parsed.preparedFix,
      alreadyPrepared: true,
    };
  }

  const preparedFix = buildPreparedFixForTask({
    taskId: task.id,
    taskTitle: task.title,
    recommendationJson: task.recommendationJson,
  });

  const recommendationJson = mergePreparedFixIntoRecommendation(
    task.recommendationJson,
    preparedFix
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
    preparedFix,
    alreadyPrepared: false,
  };
}
