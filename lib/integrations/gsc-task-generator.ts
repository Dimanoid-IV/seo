import {
  ActivityType,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TimelineEventSource,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import type { GscInsight, GscMetricsSummary } from "@/lib/integrations/gsc-types";

const GSC_TASK_SOURCE = "google_search_console";

type GscTaskDefinition = {
  title: string;
  priority: TaskPriority;
  category: TaskCategory;
};

const GSC_TASK_BY_INSIGHT_CODE: Record<string, GscTaskDefinition> = {
  low_ctr: {
    title: "Улучшить заголовки страниц",
    priority: TaskPriority.HIGH,
    category: TaskCategory.CONTENT,
  },
  impressions_no_clicks: {
    title: "Улучшить Title и Meta Description",
    priority: TaskPriority.HIGH,
    category: TaskCategory.CONTENT,
  },
  far_positions: {
    title: "Добавить новый полезный контент",
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.CONTENT,
  },
  no_impressions: {
    title: "Начать работу над SEO",
    priority: TaskPriority.HIGH,
    category: TaskCategory.CONTENT,
  },
};

export type GenerateTasksFromGscInsightsInput = {
  websiteId: string;
  organizationId: string;
  userId: string;
  metricsSummary: GscMetricsSummary;
  insights: GscInsight[];
  tx?: Prisma.TransactionClient;
};

export type GenerateTasksFromGscInsightsResult = {
  tasksCreated: number;
};

type TaskRecommendationJson = {
  gscInsightCode?: string;
  recommendation?: string;
  insightTitle?: string;
  source?: string;
};

function parseTaskRecommendationJson(value: unknown): TaskRecommendationJson {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as TaskRecommendationJson;
}

function getGscInsightCodeFromTask(recommendationJson: unknown): string | null {
  const parsed = parseTaskRecommendationJson(recommendationJson);
  return typeof parsed.gscInsightCode === "string" ? parsed.gscInsightCode : null;
}

function buildGscTaskRecommendationJson(insight: GscInsight): Prisma.InputJsonValue {
  return {
    gscInsightCode: insight.code,
    insightTitle: insight.title,
    recommendation: insight.recommendation,
    source: GSC_TASK_SOURCE,
  };
}

/**
 * Creates OPEN tasks from actionable GSC insights (rule-based, no AI).
 * Skips strong_positions and meaningful_traffic — informational only.
 */
export async function generateTasksFromGscInsights(
  input: GenerateTasksFromGscInsightsInput
): Promise<GenerateTasksFromGscInsightsResult> {
  const db = input.tx ?? getPrisma();

  const actionableInsights = input.insights.filter(
    (insight) => insight.code in GSC_TASK_BY_INSIGHT_CODE
  );

  if (actionableInsights.length === 0) {
    return { tasksCreated: 0 };
  }

  const existingTasks = await db.task.findMany({
    where: {
      websiteId: input.websiteId,
      status: {
        in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS],
      },
      deletedAt: null,
    },
    select: {
      title: true,
      recommendationJson: true,
    },
  });

  const existingInsightCodes = new Set(
    existingTasks
      .map((task) => getGscInsightCodeFromTask(task.recommendationJson))
      .filter((code): code is string => code != null)
  );
  const existingTitles = new Set(existingTasks.map((task) => task.title));

  const tasksToCreate: Prisma.TaskCreateManyInput[] = [];

  for (const insight of actionableInsights) {
    const definition = GSC_TASK_BY_INSIGHT_CODE[insight.code];
    if (!definition) {
      continue;
    }

    if (
      existingInsightCodes.has(insight.code) ||
      existingTitles.has(definition.title)
    ) {
      continue;
    }

    tasksToCreate.push({
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      title: definition.title,
      description: insight.recommendation,
      category: definition.category,
      priority: definition.priority,
      status: TaskStatus.OPEN,
      source: TaskSource.SYSTEM,
      recommendationJson: buildGscTaskRecommendationJson(insight),
    });

    existingInsightCodes.add(insight.code);
    existingTitles.add(definition.title);
  }

  if (tasksToCreate.length === 0) {
    return { tasksCreated: 0 };
  }

  await db.task.createMany({ data: tasksToCreate });

  const createdSince = new Date(Date.now() - 15_000);
  const createdTasks = await db.task.findMany({
    where: {
      websiteId: input.websiteId,
      createdAt: { gte: createdSince },
    },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
    take: tasksToCreate.length,
  });

  await db.activity.create({
    data: {
      organizationId: input.organizationId,
      websiteId: input.websiteId,
      userId: input.userId,
      type: ActivityType.TASK_CREATED,
      title: "Созданы задачи на основе Google Search Console",
      description: `RankBoost добавил ${tasksToCreate.length} задач по данным Search Console.`,
      metadataJson: {
        source: GSC_TASK_SOURCE,
        tasksCreated: tasksToCreate.length,
        insightCodes: tasksToCreate.map((task) => {
          const parsed = parseTaskRecommendationJson(task.recommendationJson);
          return parsed.gscInsightCode ?? null;
        }),
      },
    },
  });

  if (createdTasks.length > 0) {
    const { timelineAfterTasksCreatedBatch } = await import(
      "@/lib/timeline/hooks"
    );
    await timelineAfterTasksCreatedBatch({
      userId: input.userId,
      websiteId: input.websiteId,
      tasks: createdTasks,
      source: TimelineEventSource.GSC,
    });
  }

  return { tasksCreated: tasksToCreate.length };
}
