import { ActivityType, TaskStatus } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";

export type SerializedTask = {
  id: string;
  websiteId: string;
  organizationId: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  impactScore: number | null;
  completedAt: string | null;
  createdAt: string;
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
  impactScore: number | null;
  completedAt: Date | null;
  createdAt: Date;
};

function serializeTask(task: TaskRecord): SerializedTask {
  return {
    id: task.id,
    websiteId: task.websiteId,
    organizationId: task.organizationId,
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: task.status,
    impactScore: task.impactScore,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
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
    select: {
      id: true,
      websiteId: true,
      organizationId: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
      impactScore: true,
      completedAt: true,
      createdAt: true,
    },
  });
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
      select: {
        id: true,
        websiteId: true,
        organizationId: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        impactScore: true,
        completedAt: true,
        createdAt: true,
      },
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
      select: {
        id: true,
        websiteId: true,
        organizationId: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        impactScore: true,
        completedAt: true,
        createdAt: true,
      },
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
