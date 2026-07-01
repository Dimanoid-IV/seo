import {
  ArticleStatus,
  AuditStatus,
  IntegrationProvider,
  IntegrationStatus,
  TaskCategory,
  TaskStatus,
  WordPressConnectionStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { extractGscMetricsSummary } from "@/lib/integrations/gsc-metrics";

import type {
  GrowthOpportunity,
  GrowthOpportunityImpact,
  GrowthOpportunityPriority,
} from "./types";

const MS_DAY = 24 * 60 * 60 * 1000;
const AUDIT_STALE_DAYS = 30;
const ARTICLE_STALE_DAYS = 180;
const GROWTH_SCORE_STALE_DAYS = 30;

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function daysSince(date: Date | null | undefined, now: Date): number | null {
  if (!date) {
    return null;
  }
  return Math.floor((now.getTime() - date.getTime()) / MS_DAY);
}

function buildOpportunity(
  id: string,
  draft: Omit<GrowthOpportunity, "id">
): GrowthOpportunity {
  return { id, ...draft };
}

const PRIORITY_ORDER: Record<GrowthOpportunityPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const IMPACT_ORDER: Record<GrowthOpportunityImpact, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export function sortGrowthOpportunities(
  opportunities: GrowthOpportunity[]
): GrowthOpportunity[] {
  return [...opportunities].sort((left, right) => {
    const priorityDiff =
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const impactDiff =
      IMPACT_ORDER[left.estimatedImpact] - IMPACT_ORDER[right.estimatedImpact];
    if (impactDiff !== 0) {
      return impactDiff;
    }

    return left.title.localeCompare(right.title, "ru");
  });
}

function collectTaskIdsWithArticles(
  articles: Array<{
    topic: string | null;
    title: string;
    generatedByAIJobId: string | null;
  }>,
  aiJobsById: Map<string, { inputJson: unknown }>,
  contentTasks: Array<{ id: string; title: string }>
): Set<string> {
  const coveredTaskIds = new Set<string>();

  for (const article of articles) {
    if (!article.generatedByAIJobId) {
      continue;
    }

    const job = aiJobsById.get(article.generatedByAIJobId);
    const taskId = (job?.inputJson as { taskId?: string | null } | null)?.taskId;
    if (taskId) {
      coveredTaskIds.add(taskId);
    }
  }

  for (const task of contentTasks) {
    const taskTitle = normalizeText(task.title);
    if (!taskTitle) {
      continue;
    }

    const hasMatchingArticle = articles.some((article) => {
      const topic = normalizeText(article.topic);
      const title = normalizeText(article.title);
      return topic === taskTitle || title === taskTitle;
    });

    if (hasMatchingArticle) {
      coveredTaskIds.add(task.id);
    }
  }

  return coveredTaskIds;
}

/**
 * Rule-based growth opportunities from existing website data (no AI).
 */
export async function findGrowthOpportunities(
  websiteId: string
): Promise<GrowthOpportunity[]> {
  const prisma = getPrisma();
  const now = new Date();
  const opportunities: GrowthOpportunity[] = [];

  const [
    latestAudit,
    contentTasks,
    completedTasks,
    articles,
    latestGrowthSnapshot,
    gscIntegration,
    wordpressConnection,
    publishedArticlesCount,
  ] = await Promise.all([
    prisma.audit.findFirst({
      where: {
        websiteId,
        status: AuditStatus.COMPLETED,
        completedAt: { not: null },
      },
      orderBy: { completedAt: "desc" },
      select: { id: true, completedAt: true },
    }),
    prisma.task.findMany({
      where: {
        websiteId,
        deletedAt: null,
        category: TaskCategory.CONTENT,
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
      },
      select: { id: true, title: true },
    }),
    prisma.task.findMany({
      where: {
        websiteId,
        deletedAt: null,
        status: TaskStatus.COMPLETED,
        completedAt: { not: null },
      },
      select: { id: true, title: true, completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
    prisma.article.findMany({
      where: { websiteId, deletedAt: null },
      select: {
        id: true,
        title: true,
        topic: true,
        updatedAt: true,
        generatedByAIJobId: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.growthScoreSnapshot.findFirst({
      where: { websiteId },
      orderBy: { createdAt: "desc" },
      select: { score: true, createdAt: true },
    }),
    prisma.integration.findFirst({
      where: {
        websiteId,
        provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
        status: IntegrationStatus.CONNECTED,
      },
      select: {
        googleData: {
          select: { metricsJson: true },
        },
      },
    }),
    prisma.wordPressConnection.findFirst({
      where: {
        websiteId,
        disconnectedAt: null,
        status: WordPressConnectionStatus.CONNECTED,
      },
      select: { id: true },
    }),
    prisma.article.count({
      where: {
        websiteId,
        deletedAt: null,
        status: ArticleStatus.PUBLISHED,
      },
    }),
  ]);

  const aiJobIds = articles
    .map((article) => article.generatedByAIJobId)
    .filter((value): value is string => Boolean(value));

  const aiJobs =
    aiJobIds.length > 0
      ? await prisma.aIJob.findMany({
          where: { id: { in: aiJobIds } },
          select: { id: true, inputJson: true },
        })
      : [];

  const aiJobsById = new Map(aiJobs.map((job) => [job.id, job]));
  const taskIdsWithArticles = collectTaskIdsWithArticles(
    articles,
    aiJobsById,
    contentTasks
  );

  for (const task of contentTasks) {
    if (taskIdsWithArticles.has(task.id)) {
      continue;
    }

    opportunities.push(
      buildOpportunity(`content:task-no-article:${task.id}`, {
        type: "CONTENT",
        title: "Создать статью",
        description: `По задаче «${task.title}» ещё нет статьи. Создайте контент, чтобы закрыть рекомендацию.`,
        priority: "HIGH",
        estimatedImpact: "HIGH",
        estimatedEffort: "MEDIUM",
        createdFrom: "content_task",
      })
    );
  }

  for (const task of completedTasks) {
    if (!task.completedAt) {
      continue;
    }

    const hasFollowUpAudit =
      latestAudit?.completedAt &&
      latestAudit.completedAt.getTime() > task.completedAt.getTime();

    if (hasFollowUpAudit) {
      continue;
    }

    opportunities.push(
      buildOpportunity(`seo:verify-after-task:${task.id}`, {
        type: "SEO",
        title: "Проверить эффект изменений",
        description: `Задача «${task.title}» выполнена, но после этого не было повторного аудита. Запустите проверку, чтобы увидеть результат.`,
        priority: "MEDIUM",
        estimatedImpact: "MEDIUM",
        estimatedEffort: "SMALL",
        createdFrom: "task_completion",
      })
    );
  }

  const auditAgeDays = daysSince(latestAudit?.completedAt, now);
  if (auditAgeDays === null || auditAgeDays > AUDIT_STALE_DAYS) {
    opportunities.push(
      buildOpportunity("maintenance:audit-stale", {
        type: "TECHNICAL",
        title: "Повторить аудит сайта",
        description:
          auditAgeDays === null
            ? "Аудит ещё не проводился. Запустите первую проверку, чтобы получить рекомендации."
            : `Последний аудит был ${auditAgeDays} дн. назад. Повторная проверка покажет новые точки роста.`,
        priority: auditAgeDays != null && auditAgeDays > 60 ? "HIGH" : "MEDIUM",
        estimatedImpact: "HIGH",
        estimatedEffort: "SMALL",
        createdFrom: "audit",
      })
    );
  }

  if (articles.length > 0) {
    const latestArticle = articles[0];
    const articleAgeDays = daysSince(latestArticle.updatedAt, now);

    if (articleAgeDays != null && articleAgeDays > ARTICLE_STALE_DAYS) {
      opportunities.push(
        buildOpportunity("content:old-content", {
          type: "CONTENT",
          title: "Обновить старый контент",
          description: `Последняя статья обновлялась ${articleAgeDays} дн. назад. Актуализируйте контент, чтобы сохранить позиции в поиске.`,
          priority: "MEDIUM",
          estimatedImpact: "MEDIUM",
          estimatedEffort: "MEDIUM",
          createdFrom: "article",
        })
      );
    }
  }

  const gscSummary = gscIntegration?.googleData?.metricsJson
    ? extractGscMetricsSummary(gscIntegration.googleData.metricsJson)
    : null;

  if (gscSummary && gscSummary.impressions > 0 && gscSummary.ctr < 0.01) {
    opportunities.push(
      buildOpportunity("gsc:low-ctr", {
        type: "GSC",
        title: "Улучшить сниппеты",
        description:
          "CTR ниже 1% — пользователи видят сайт в Google, но редко кликают. Улучшите title и meta description.",
        priority: "HIGH",
        estimatedImpact: "HIGH",
        estimatedEffort: "SMALL",
        createdFrom: "gsc_metrics",
      })
    );
  }

  if (
    gscSummary &&
    gscSummary.impressions > 50 &&
    gscSummary.position >= 11 &&
    gscSummary.position <= 20
  ) {
    opportunities.push(
      buildOpportunity("gsc:position-11-20", {
        type: "SEO",
        title: "Можно вывести страницу в ТОП-10",
        description: `Средняя позиция ${gscSummary.position.toFixed(1)} — сайт уже на второй странице выдачи. Небольшие улучшения могут дать заметный рост кликов.`,
        priority: "HIGH",
        estimatedImpact: "HIGH",
        estimatedEffort: "MEDIUM",
        createdFrom: "gsc_metrics",
      })
    );
  }

  const growthSnapshotAgeDays = daysSince(latestGrowthSnapshot?.createdAt, now);
  if (
    growthSnapshotAgeDays != null &&
    growthSnapshotAgeDays > GROWTH_SCORE_STALE_DAYS
  ) {
    opportunities.push(
      buildOpportunity("maintenance:growth-score-stale", {
        type: "MAINTENANCE",
        title: "Продолжить оптимизацию",
        description: `Growth Score не обновлялся ${growthSnapshotAgeDays} дн. Запустите аудит или выполните задачи, чтобы двигать показатель дальше.`,
        priority: "MEDIUM",
        estimatedImpact: "MEDIUM",
        estimatedEffort: "SMALL",
        createdFrom: "growth_score",
      })
    );
  }

  if (!wordpressConnection) {
    opportunities.push(
      buildOpportunity("integration:wordpress-missing", {
        type: "MAINTENANCE",
        title: "Подключить WordPress",
        description:
          "Подключите WordPress, чтобы публиковать статьи из RankBoost без ручного копирования.",
        priority: "MEDIUM",
        estimatedImpact: "MEDIUM",
        estimatedEffort: "LARGE",
        createdFrom: "integration",
      })
    );
  }

  if (!gscIntegration) {
    opportunities.push(
      buildOpportunity("integration:gsc-missing", {
        type: "GSC",
        title: "Подключить Google Search Console",
        description:
          "Подключите Search Console, чтобы RankBoost видел реальные клики, показы и новые SEO-возможности.",
        priority: "HIGH",
        estimatedImpact: "HIGH",
        estimatedEffort: "MEDIUM",
        createdFrom: "integration",
      })
    );
  }

  if (publishedArticlesCount === 0) {
    opportunities.push(
      buildOpportunity("content:no-published-articles", {
        type: "CONTENT",
        title: "Опубликовать первую статью",
        description:
          "На сайте ещё нет опубликованных статей. Опубликуйте первый материал, чтобы начать получать органический трафик.",
        priority: "HIGH",
        estimatedImpact: "HIGH",
        estimatedEffort: "MEDIUM",
        createdFrom: "article",
      })
    );
  }

  return sortGrowthOpportunities(opportunities);
}
