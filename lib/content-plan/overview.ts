import {
  ArticleStatus,
  MonthlyPlanStatus,
  SocialPostStatus,
  TaskStatus,
  WebsiteStatus,
} from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

import { currentMonthKey } from "./format";
import type { ContentPlanOverviewResponse } from "./types";

const ACTIVE_PLAN_STATUSES: MonthlyPlanStatus[] = [
  MonthlyPlanStatus.DRAFT,
  MonthlyPlanStatus.ACTIVE,
  MonthlyPlanStatus.LOCKED,
];

const ARTICLE_STATUSES: ArticleStatus[] = [
  ArticleStatus.IDEA,
  ArticleStatus.DRAFT,
  ArticleStatus.WAITING_REVIEW,
  ArticleStatus.APPROVED,
];

const SOCIAL_STATUSES: SocialPostStatus[] = [
  SocialPostStatus.DRAFT,
  SocialPostStatus.READY,
  SocialPostStatus.COPIED,
  SocialPostStatus.SCHEDULED,
];

const TASK_PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/**
 * Loads content plan overview for the authenticated user's primary website.
 */
export async function getContentPlanOverview(
  currentUser: CurrentUser
): Promise<ContentPlanOverviewResponse> {
  const prisma = getPrisma();
  const month = currentMonthKey();

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
        month,
        monthlyPlan: null,
        tasks: [],
        articles: [],
        socialPosts: [],
      },
    };
  }

  const monthlyPlanRecord = await prisma.monthlyPlan.findUnique({
    where: {
      websiteId_month: {
        websiteId: website.id,
        month,
      },
    },
    select: {
      id: true,
      status: true,
      summary: true,
      goalsJson: true,
    },
  });

  const monthlyPlan =
    monthlyPlanRecord &&
    ACTIVE_PLAN_STATUSES.includes(monthlyPlanRecord.status)
      ? {
          id: monthlyPlanRecord.id,
          status: monthlyPlanRecord.status.toLowerCase(),
          summary: monthlyPlanRecord.summary,
          goalsJson: monthlyPlanRecord.goalsJson,
        }
      : null;

  const tasksRaw = await prisma.task.findMany({
    where: {
      websiteId: website.id,
      deletedAt: null,
      status: {
        in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS],
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
      impactScore: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 20,
  });

  const tasks = [...tasksRaw]
    .sort(
      (a, b) =>
        (TASK_PRIORITY_ORDER[a.priority] ?? 99) -
          (TASK_PRIORITY_ORDER[b.priority] ?? 99) ||
        (b.impactScore ?? 0) - (a.impactScore ?? 0)
    )
    .slice(0, 10)
    .map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      impactScore: task.impactScore,
    }));

  const articles = await prisma.article.findMany({
    where: {
      websiteId: website.id,
      deletedAt: null,
      status: { in: ARTICLE_STATUSES },
    },
    select: {
      id: true,
      title: true,
      topic: true,
      targetKeyword: true,
      status: true,
      language: true,
      qualityPassed: true,
      generatedByAIJobId: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const socialPosts = await prisma.socialPost.findMany({
    where: {
      websiteId: website.id,
      status: { in: SOCIAL_STATUSES },
    },
    select: {
      id: true,
      platform: true,
      text: true,
      hook: true,
      status: true,
      scheduledFor: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return {
    data: {
      website: { id: website.id, url: website.url },
      month,
      monthlyPlan,
      tasks,
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        topic: article.topic,
        targetKeyword: article.targetKeyword,
        status: article.status,
        language: article.language,
        qualityPassed: article.qualityPassed,
        generatedByAIJobId: article.generatedByAIJobId,
      })),
      socialPosts: socialPosts.map((post) => ({
        id: post.id,
        platform: post.platform,
        text: post.text,
        hook: post.hook,
        status: post.status,
        scheduledFor: post.scheduledFor?.toISOString() ?? null,
      })),
    },
  };
}
