import { ActivityType, TaskStatus } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";
import { parseTaskRecommendation } from "@/lib/tasks/recommendation";

export type SerializedTask = {
  id: string;
  websiteId: string;
  organizationId: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  source: string;
  impactScore: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  whyItMatters: string | null;
  recommendedAction: string | null;
  estimatedFixMinutes: number | null;
  auditCheckCode: string | null;
};

type TaskRecord = {
  id: string;
  websiteId: string;
  organizationId: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: TaskStatus;
  source: string;
  impactScore: number | null;
  recommendationJson: unknown;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const TASK_SELECT = {
  id: true,
  websiteId: true,
  organizationId: true,
  title: true,
  description: true,
  category: true,
  priority: true,
  status: true,
  source: true,
  impactScore: true,
  recommendationJson: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function serializeTask(task: TaskRecord): SerializedTask {
  const recommendation = parseTaskRecommendation(task.recommendationJson);

  return {
    id: task.id,
    websiteId: task.websiteId,
    organizationId: task.organizationId,
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: task.status,
    source: task.source,
    impactScore: task.impactScore,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    whyItMatters: recommendation.whyItMatters,
    recommendedAction: recommendation.recommendation,
    estimatedFixMinutes: recommendation.estimatedFixMinutes,
    auditCheckCode: recommendation.auditCheckCode,
  };
}

async function findTaskForUser(taskId: string, userId: string) {
  const prisma = getPrisma();

  return prisma.task.findFirst({
    where: {
      id: taskId,
      deletedAt: null,
      organization: {
        ownerUserId: userId,
        deletedAt: null,
      },
    },
    select: TASK_SELECT,
  });
}

const UPDATABLE_STATUSES = new Set<TaskStatus>([
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.DISMISSED,
]);

export async function updateTaskStatus(input: {
  taskId: string;
  status: TaskStatus;
  currentUser: CurrentUser;
}): Promise<SerializedTask> {
  if (!UPDATABLE_STATUSES.has(input.status)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Недопустимый статус задачи",
      { details: { status: input.status } }
    );
  }

  if (input.status === TaskStatus.COMPLETED) {
    return completeTask({
      taskId: input.taskId,
      currentUser: input.currentUser,
    });
  }

  if (input.status === TaskStatus.DISMISSED) {
    return dismissTask({
      taskId: input.taskId,
      currentUser: input.currentUser,
    });
  }

  return startTaskInProgress({
    taskId: input.taskId,
    currentUser: input.currentUser,
  });
}

export async function startTaskInProgress(input: {
  taskId: string;
  currentUser: CurrentUser;
}): Promise<SerializedTask> {
  const task = await findTaskForUser(input.taskId, input.currentUser.id);

  if (!task) {
    throw new AppError(ErrorCode.NOT_FOUND, "Задача не найдена или недоступна");
  }

  if (task.status === TaskStatus.IN_PROGRESS) {
    return serializeTask(task);
  }

  if (
    task.status !== TaskStatus.OPEN &&
    task.status !== TaskStatus.WAITING_REVIEW
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Эту задачу нельзя перевести в работу",
      { details: { status: task.status } }
    );
  }

  const prisma = getPrisma();
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: TaskStatus.IN_PROGRESS },
    select: TASK_SELECT,
  });

  return serializeTask(updated);
}

export async function completeTask(input: {
  taskId: string;
  currentUser: CurrentUser;
}): Promise<SerializedTask> {
  const task = await findTaskForUser(input.taskId, input.currentUser.id);

  if (!task) {
    throw new AppError(ErrorCode.NOT_FOUND, "Задача не найдена или недоступна");
  }

  if (task.status === TaskStatus.COMPLETED) {
    return serializeTask(task);
  }

  const prisma = getPrisma();
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.task.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: now,
      },
      select: TASK_SELECT,
    });

    await tx.activity.create({
      data: {
        organizationId: task.organizationId,
        websiteId: task.websiteId,
        userId: input.currentUser.id,
        type: ActivityType.TASK_COMPLETED,
        title: "Задача выполнена",
        description: task.title,
        metadataJson: { taskId: task.id },
      },
    });

    return record;
  });

  try {
    await syncGrowthOpportunitiesForWebsite({
      websiteId: task.websiteId,
      organizationId: task.organizationId,
      userId: input.currentUser.id,
    });
  } catch {
    // Growth sync must not block task completion.
  }

  try {
    const { timelineAfterTaskCompleted } = await import("@/lib/timeline/hooks");
    await timelineAfterTaskCompleted({
      userId: input.currentUser.id,
      websiteId: task.websiteId,
      taskId: task.id,
      title: task.title,
    });
  } catch {
    // Timeline sync must not block task completion.
  }

  return serializeTask(updated);
}

export async function dismissTask(input: {
  taskId: string;
  currentUser: CurrentUser;
}): Promise<SerializedTask> {
  const task = await findTaskForUser(input.taskId, input.currentUser.id);

  if (!task) {
    throw new AppError(ErrorCode.NOT_FOUND, "Задача не найдена или недоступна");
  }

  if (task.status === TaskStatus.DISMISSED) {
    return serializeTask(task);
  }

  const prisma = getPrisma();

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.task.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.DISMISSED,
      },
      select: TASK_SELECT,
    });

    await tx.activity.create({
      data: {
        organizationId: task.organizationId,
        websiteId: task.websiteId,
        userId: input.currentUser.id,
        type: ActivityType.SYSTEM_NOTICE,
        title: "Задача скрыта",
        description: task.title,
        metadataJson: { taskId: task.id, action: "dismiss" },
      },
    });

    return record;
  });

  return serializeTask(updated);
}
