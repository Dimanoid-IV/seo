import { IntegrationProvider, IntegrationStatus, TaskStatus, WebsiteStatus } from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { sortDashboardTasks } from "@/lib/audit/generate-tasks";
import { getPrisma } from "@/lib/db";
import {
  getWordPressConnection,
  mapWordPressConnectionStatus,
} from "@/lib/integrations/wordpress-connector";
import { parseTaskRecommendationWithFix } from "@/lib/tasks/prepared-fix";

import type { TaskIntegrationsContext, TasksOverviewResponse } from "./types";

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
        integrations: {
          gscConnected: false,
          gscPropertySelected: false,
          wordpressConnected: false,
        },
      },
    };
  }

  const [gscIntegration, wordpressConnection] = await Promise.all([
    prisma.integration.findFirst({
      where: {
        websiteId: website.id,
        provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      },
      select: {
        status: true,
        googleData: { select: { searchConsoleSiteUrl: true } },
      },
    }),
    getWordPressConnection({ websiteId: website.id }),
  ]);

  const integrations: TaskIntegrationsContext = {
    gscConnected: gscIntegration?.status === IntegrationStatus.CONNECTED,
    gscPropertySelected: Boolean(gscIntegration?.googleData?.searchConsoleSiteUrl),
    wordpressConnected: wordpressConnection
      ? mapWordPressConnectionStatus(wordpressConnection.status).connected
      : false,
  };

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
      recommendationJson: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
    },
  });

  const activeTasks = sortDashboardTasks(
    tasksRaw.filter((task) => ACTIVE_STATUSES.includes(task.status))
  );
  const closedTasks = [...tasksRaw]
    .filter((task) => CLOSED_STATUSES.includes(task.status))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const tasks = [...activeTasks, ...closedTasks].map((task) => {
    const recommendation = parseTaskRecommendationWithFix(task.recommendationJson);

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      source: task.source,
      impactScore: task.impactScore,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt?.toISOString() ?? null,
      whyItMatters: recommendation.whyItMatters,
      recommendedAction: recommendation.recommendation,
      estimatedFixMinutes: recommendation.estimatedFixMinutes,
      auditCheckCode: recommendation.auditCheckCode,
      preparedFixStatus: recommendation.preparedFix?.status ?? null,
      preparedFixPreview: recommendation.preparedFix?.preview ?? null,
      preparedFixGeneratedBy: recommendation.preparedFix?.generatedBy ?? null,
    };
  });

  return {
    data: {
      website: { id: website.id, url: website.url },
      tasks,
      integrations,
    },
  };
}
