import "server-only";

import {
  ArticleStatus,
  EmailApprovalSource,
  EmailApprovalType,
  IntegrationProvider,
  IntegrationStatus,
  SocialPostStatus,
  TaskPriority,
  TaskStatus,
  WordPressConnectionStatus,
} from "@prisma/client";

import { formatMonthlyAutopilotPlan } from "@/lib/autopilot/format";
import { currentMonthKey } from "@/lib/autopilot/month-utils";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import type { EmailApprovalSourceSummary } from "./types";

export type EmailApprovalSourceData = {
  website: {
    id: string;
    url: string;
    displayName: string | null;
    primaryLanguage: string;
  };
  userEmail: string | null;
  monthlyPlan: ReturnType<typeof formatMonthlyAutopilotPlan> | null;
  articles: Array<{
    id: string;
    title: string;
    status: string;
    qualityPassed: boolean | null;
    wordpressPostId: string | null;
  }>;
  socialPosts: Array<{
    id: string;
    title: string | null;
    platform: string;
    status: string;
    qualityScore: number | null;
  }>;
  tasks: Array<{ id: string; title: string; priority: string; status: string }>;
  timelineEvents: Array<{ id: string; title: string; summary: string | null; severity: string }>;
  growthScore: {
    latest: number | null;
    delta: number | null;
  };
  integrations: {
    gscConnected: boolean;
    gscError: boolean;
    gscErrorMessage: string | null;
    wordpressConnected: boolean;
    wordpressError: boolean;
  };
  sourceSummary: EmailApprovalSourceSummary;
  relatedPlanId?: string;
  relatedArticleIds: string[];
  relatedSocialPostIds: string[];
  relatedTaskIds: string[];
  relatedTimelineEventIds: string[];
};

export async function getEmailApprovalSourceData(input: {
  userId: string;
  websiteId: string;
  organizationId: string;
  type: EmailApprovalType;
  source: EmailApprovalSource;
  sourceId?: string | null;
}): Promise<EmailApprovalSourceData> {
  const prisma = getPrisma();

  const website = await prisma.website.findFirstOrThrow({
    where: { id: input.websiteId, deletedAt: null },
    select: {
      id: true,
      url: true,
      displayName: true,
      primaryLanguage: true,
      currentGrowthScore: true,
    },
  });

  const user = await prisma.user.findFirst({
    where: { id: input.userId },
    select: { email: true },
  });

  const month = currentMonthKey();
  const monthlyPlanRecord = input.sourceId
    ? await prisma.monthlyAutopilotPlan.findFirst({
        where: {
          id: input.sourceId,
          websiteId: input.websiteId,
          userId: input.userId,
          archivedAt: null,
        },
      })
    : await prisma.monthlyAutopilotPlan.findFirst({
        where: {
          websiteId: input.websiteId,
          userId: input.userId,
          month,
          archivedAt: null,
        },
        orderBy: { updatedAt: "desc" },
      });

  const monthlyPlan = monthlyPlanRecord
    ? formatMonthlyAutopilotPlan(monthlyPlanRecord)
    : null;

  const articles = await prisma.article.findMany({
    where: {
      websiteId: input.websiteId,
      deletedAt: null,
      status: {
        in: [
          ArticleStatus.DRAFT,
          ArticleStatus.WAITING_REVIEW,
          ArticleStatus.WORDPRESS_DRAFT_CREATED,
          ArticleStatus.IDEA,
        ],
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      qualityPassed: true,
      wordpressPostId: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const socialPosts = await prisma.socialPost.findMany({
    where: {
      websiteId: input.websiteId,
      deletedAt: null,
      status: {
        in: [
          SocialPostStatus.DRAFT,
          SocialPostStatus.READY,
          SocialPostStatus.COPIED,
        ],
      },
    },
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      qualityScore: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const tasks = await prisma.task.findMany({
    where: {
      websiteId: input.websiteId,
      deletedAt: null,
      status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
    },
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const highPriorityTasks = tasks.filter(
    (t) => t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH
  );

  const timelineEvents = await prisma.timelineEvent.findMany({
    where: {
      websiteId: input.websiteId,
      userId: input.userId,
    },
    select: {
      id: true,
      title: true,
      summary: true,
      severity: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const latestSnapshot = await prisma.growthScoreSnapshot.findFirst({
    where: { websiteId: input.websiteId },
    orderBy: { createdAt: "desc" },
    select: { score: true, delta: true },
  });

  const gscIntegration = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
    },
    select: { status: true, lastErrorMessage: true },
  });

  const wpConnection = await prisma.wordPressConnection.findFirst({
    where: { websiteId: input.websiteId },
    select: { status: true },
  });

  const gscConnected = gscIntegration?.status === IntegrationStatus.CONNECTED;
  const gscError =
    gscIntegration?.status === IntegrationStatus.ERROR ||
    Boolean(gscIntegration?.lastErrorMessage);

  const wordpressConnected =
    wpConnection?.status === WordPressConnectionStatus.CONNECTED;
  const wordpressError =
    wpConnection?.status === WordPressConnectionStatus.ERROR ||
    wpConnection?.status === WordPressConnectionStatus.DISCONNECTED;

  const sourceSummary: EmailApprovalSourceSummary = {
    hasMonthlyPlan: Boolean(monthlyPlan),
    hasArticles: articles.length > 0,
    hasSocialPosts: socialPosts.length > 0,
    hasTasks: tasks.length > 0,
    hasTimelineEvents: timelineEvents.length > 0,
    hasEnoughData:
      Boolean(monthlyPlan) ||
      articles.length > 0 ||
      socialPosts.length > 0 ||
      tasks.length > 0 ||
      timelineEvents.length > 0 ||
      gscError ||
      wordpressError ||
      (latestSnapshot?.delta != null && latestSnapshot.delta < 0),
  };

  if (
    input.type === EmailApprovalType.MONTHLY_PLAN_REVIEW &&
    !monthlyPlan
  ) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Generate a monthly Autopilot plan first."
    );
  }

  return {
    website: {
      id: website.id,
      url: website.url,
      displayName: website.displayName,
      primaryLanguage: website.primaryLanguage,
    },
    userEmail: user?.email ?? null,
    monthlyPlan,
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      qualityPassed: a.qualityPassed,
      wordpressPostId: a.wordpressPostId,
    })),
    socialPosts: socialPosts.map((p) => ({
      id: p.id,
      title: p.title,
      platform: p.platform,
      status: p.status,
      qualityScore: p.qualityScore,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
    })),
    timelineEvents: timelineEvents.map((e) => ({
      id: e.id,
      title: e.title,
      summary: e.summary,
      severity: e.severity,
    })),
    growthScore: {
      latest: latestSnapshot?.score ?? website.currentGrowthScore,
      delta: latestSnapshot?.delta ?? null,
    },
    integrations: {
      gscConnected,
      gscError,
      gscErrorMessage: gscIntegration?.lastErrorMessage ?? null,
      wordpressConnected,
      wordpressError,
    },
    sourceSummary,
    relatedPlanId: monthlyPlanRecord?.id,
    relatedArticleIds: articles.map((a) => a.id),
    relatedSocialPostIds: socialPosts.map((p) => p.id),
    relatedTaskIds: highPriorityTasks.map((t) => t.id),
    relatedTimelineEventIds: timelineEvents.slice(0, 5).map((e) => e.id),
  };
}
