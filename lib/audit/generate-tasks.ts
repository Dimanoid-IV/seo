import {
  ActivityType,
  AuditCheckSeverity,
  AuditCheckStatus,
  TaskCategory,
  TaskEffort,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TimelineEventSource,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";

const MAX_TASKS_PER_AUDIT = 10;

const SEVERITY_ORDER: Record<AuditCheckSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export type GenerateTasksFromAuditChecksInput = {
  auditId: string;
  websiteId: string;
  organizationId: string;
  userId?: string;
  tx?: Prisma.TransactionClient;
};

export type GenerateTasksFromAuditChecksResult = {
  tasksCreated: number;
};

type RecommendationJson = {
  recommendation?: string;
  whyItMatters?: string;
  estimatedFixMinutes?: number;
  auditCheckCode?: string;
  auditCheckId?: string;
};

function mapCheckCategoryToTaskCategory(
  category: string
): TaskCategory {
  if (Object.values(TaskCategory).includes(category as TaskCategory)) {
    return category as TaskCategory;
  }
  return TaskCategory.OTHER;
}

function mapSeverityToPriority(severity: AuditCheckSeverity): TaskPriority {
  if (severity === AuditCheckSeverity.CRITICAL || severity === AuditCheckSeverity.HIGH) {
    return TaskPriority.HIGH;
  }
  if (severity === AuditCheckSeverity.MEDIUM) {
    return TaskPriority.MEDIUM;
  }
  return TaskPriority.LOW;
}

function mapEstimatedFixMinutesToEffort(minutes: number | undefined): TaskEffort {
  if (minutes == null || minutes <= 10) {
    return TaskEffort.LOW;
  }
  if (minutes <= 45) {
    return TaskEffort.MEDIUM;
  }
  return TaskEffort.HIGH;
}

function parseRecommendationJson(value: unknown): RecommendationJson {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as RecommendationJson;
}

function getAuditCheckCodeFromTaskRecommendation(
  recommendationJson: unknown
): string | null {
  const parsed = parseRecommendationJson(recommendationJson);
  return typeof parsed.auditCheckCode === "string" ? parsed.auditCheckCode : null;
}

function buildTaskRecommendationJson(
  check: {
    id: string;
    code: string;
    recommendationJson: unknown;
  }
): Prisma.InputJsonValue {
  const parsed = parseRecommendationJson(check.recommendationJson);

  return {
    whyItMatters: parsed.whyItMatters ?? null,
    recommendation: parsed.recommendation ?? null,
    estimatedFixMinutes: parsed.estimatedFixMinutes ?? null,
    auditCheckCode: check.code,
    auditCheckId: check.id,
  };
}

/**
 * Creates up to 10 OPEN tasks from FAIL/WARNING audit checks (rule-based, no AI).
 */
export async function generateTasksFromAuditChecks(
  input: GenerateTasksFromAuditChecksInput
): Promise<GenerateTasksFromAuditChecksResult> {
  const db = input.tx ?? getPrisma();

  const checks = await db.auditCheck.findMany({
    where: {
      auditId: input.auditId,
      websiteId: input.websiteId,
      status: {
        in: [AuditCheckStatus.FAIL, AuditCheckStatus.WARNING],
      },
    },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      scoreImpact: true,
      recommendationJson: true,
    },
  });

  if (checks.length === 0) {
    return { tasksCreated: 0 };
  }

  const rankedChecks = [...checks].sort((a, b) => {
    const impactDiff = (b.scoreImpact ?? 0) - (a.scoreImpact ?? 0);
    if (impactDiff !== 0) {
      return impactDiff;
    }
    return (
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
    );
  });

  const candidateChecks = rankedChecks.slice(0, MAX_TASKS_PER_AUDIT);

  const existingTasks = await db.task.findMany({
    where: {
      websiteId: input.websiteId,
      source: TaskSource.AUDIT,
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

  const existingTitles = new Set(existingTasks.map((task) => task.title));
  const existingCodes = new Set(
    existingTasks
      .map((task) => getAuditCheckCodeFromTaskRecommendation(task.recommendationJson))
      .filter((code): code is string => code != null)
  );

  const tasksToCreate: Prisma.TaskCreateManyInput[] = [];

  for (const check of candidateChecks) {
    if (existingTitles.has(check.title) || existingCodes.has(check.code)) {
      continue;
    }

    const recommendation = parseRecommendationJson(check.recommendationJson);

    tasksToCreate.push({
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      auditId: input.auditId,
      title: check.title,
      description: recommendation.recommendation ?? check.description ?? null,
      category: mapCheckCategoryToTaskCategory(check.category),
      priority: mapSeverityToPriority(check.severity),
      status: TaskStatus.OPEN,
      impactScore: check.scoreImpact,
      effort: mapEstimatedFixMinutesToEffort(recommendation.estimatedFixMinutes),
      source: TaskSource.AUDIT,
      recommendationJson: buildTaskRecommendationJson(check),
    });

    existingTitles.add(check.title);
    existingCodes.add(check.code);
  }

  if (tasksToCreate.length === 0) {
    return { tasksCreated: 0 };
  }

  await db.task.createMany({ data: tasksToCreate });

  if (input.userId) {
    await db.activity.create({
      data: {
        organizationId: input.organizationId,
        websiteId: input.websiteId,
        userId: input.userId,
        type: ActivityType.TASK_CREATED,
        title: "Созданы новые задачи для улучшения сайта",
        description: `RankBoost подготовил ${tasksToCreate.length} приоритетных задач на основе аудита.`,
        metadataJson: {
          auditId: input.auditId,
          tasksCreated: tasksToCreate.length,
          source: TaskSource.AUDIT,
        },
      },
    });

    const createdSince = new Date(Date.now() - 15_000);
    const createdTasks = await db.task.findMany({
      where: {
        websiteId: input.websiteId,
        auditId: input.auditId,
        createdAt: { gte: createdSince },
      },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: tasksToCreate.length,
    });

    if (createdTasks.length > 0) {
      const { timelineAfterTasksCreatedBatch } = await import(
        "@/lib/timeline/hooks"
      );
      await timelineAfterTasksCreatedBatch({
        userId: input.userId,
        websiteId: input.websiteId,
        tasks: createdTasks,
        source: TimelineEventSource.RULE_ENGINE,
      });
    }
  }

  return { tasksCreated: tasksToCreate.length };
}

export function sortDashboardTasks<
  T extends {
    priority: TaskPriority;
    impactScore: number | null;
    createdAt: Date;
  }
>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const priorityDiff =
      (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    const impactDiff = (b.impactScore ?? 0) - (a.impactScore ?? 0);
    if (impactDiff !== 0) {
      return impactDiff;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}
