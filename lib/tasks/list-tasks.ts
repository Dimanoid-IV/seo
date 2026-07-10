import { TaskStatus, WebsiteStatus } from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { sortDashboardTasks } from "@/lib/audit/generate-tasks";
import { getPrisma } from "@/lib/db";

import type { TasksOverviewResponse } from "./types";

const ACTIVE_STATUSES: TaskStatus[] = [TaskStatus.OPEN, TaskStatus.IN_PROGRESS];
const CLOSED_STATUSES: TaskStatus[] = [
  TaskStatus.COMPLETED,
  TaskStatus.DISMISSED,
];

/**
 * Loads SEO tasks for the authenticated user's primary website.
 */
export async function getTasksOverview(
  currentUser: CurrentUser
): Promise<TasksOverviewResponse> {
  const prisma = getPrisma();

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  const website = organization
    ? await prisma.website.findFirst({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, url: true },
      })
    : null;

  if (!website) {
    return {
      data: {
        website: null,
        tasks: [],
      },
    };
  }

  const tasksRaw = await prisma.task.findMany({
    where: {
      websiteId: website.id,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
      source: true,
      impactScore: true,
      createdAt: true,
    },
  });

  const activeTasks = sortDashboardTasks(
    tasksRaw.filter((task) => ACTIVE_STATUSES.includes(task.status))
  );
  const closedTasks = [...tasksRaw]
    .filter((task) => CLOSED_STATUSES.includes(task.status))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const tasks = [...activeTasks, ...closedTasks].map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: task.status,
    source: task.source,
    impactScore: task.impactScore,
    createdAt: task.createdAt.toISOString(),
  }));

  return {
    data: {
      website: { id: website.id, url: website.url },
      tasks,
    },
  };
}
