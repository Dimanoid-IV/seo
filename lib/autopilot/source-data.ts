import "server-only";

import {
  ArticleStatus,
  AuditCheckSeverity,
  AuditCheckStatus,
  AuditStatus,
  IntegrationProvider,
  IntegrationStatus,
  SocialPostStatus,
  TaskPriority,
  TaskStatus,
  TimelineEventSeverity,
  WordPressConnectionStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { extractGscMetricsSummary } from "@/lib/integrations/gsc-metrics";
import {
  sortGrowthOpportunities,
} from "@/lib/growth/opportunities";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";

import { getMonthDateRange } from "./month-utils";
import type { MonthlyAutopilotSourceSummary } from "./types";

export type MonthlyAutopilotSourceData = {
  website: {
    id: string;
    url: string;
    displayName: string | null;
    primaryLanguage: string;
    niche: string | null;
    currentGrowthScore: number | null;
    businessGoals: unknown;
  };
  month: string;
  growthScore: {
    latest: number | null;
    previous: number | null;
    delta: number | null;
  };
  audit: {
    id: string;
    growthScore: number | null;
    completedAt: Date | null;
    criticalFindings: Array<{ id: string; title: string; category: string }>;
    technicalFindings: Array<{ id: string; title: string; category: string }>;
  } | null;
  tasks: {
    open: Array<{
      id: string;
      title: string;
      description: string | null;
      priority: string;
      category: string;
      source: string;
    }>;
    inProgress: Array<{
      id: string;
      title: string;
      priority: string;
      category: string;
    }>;
    recentlyCompleted: Array<{ id: string; title: string; completedAt: Date | null }>;
    highPriority: Array<{ id: string; title: string; priority: string; category: string }>;
  };
  gsc: {
    connected: boolean;
    hasError: boolean;
    lastErrorMessage: string | null;
    metricsSummary: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    } | null;
    opportunityCount: number;
  };
  articles: {
    drafts: Array<{ id: string; title: string; status: string; targetKeyword: string | null }>;
    waitingReview: Array<{ id: string; title: string; status: string }>;
    recentlyCreated: Array<{ id: string; title: string; createdAt: Date }>;
    wordpressDrafts: Array<{ id: string; title: string }>;
  };
  socialPosts: {
    ready: Array<{ id: string; title: string | null; platform: string; status: string }>;
    drafts: Array<{ id: string; title: string | null; platform: string }>;
    copied: Array<{ id: string; title: string | null }>;
  };
  timeline: {
    recent: Array<{
      id: string;
      type: string;
      title: string;
      summary: string | null;
      severity: string;
      createdAt: Date;
    }>;
    warnings: Array<{ id: string; title: string; summary: string | null }>;
    opportunities: Array<{ id: string; title: string; summary: string | null }>;
  };
  integrations: {
    gscConnected: boolean;
    gscError: boolean;
    wordpressConnected: boolean;
    wordpressError: boolean;
  };
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    type: string;
  }>;
  contentPlan: {
    hasActivePlan: boolean;
    planItemCount: number;
  };
  sourceSummary: MonthlyAutopilotSourceSummary;
};

export async function getMonthlyAutopilotSourceData(input: {
  userId: string;
  websiteId: string;
  organizationId: string;
  month: string;
}): Promise<MonthlyAutopilotSourceData> {
  const prisma = getPrisma();
  const { start } = getMonthDateRange(input.month);
  const recentStart = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);

  const website = await prisma.website.findFirstOrThrow({
    where: { id: input.websiteId, deletedAt: null },
    select: {
      id: true,
      url: true,
      displayName: true,
      primaryLanguage: true,
      niche: true,
      currentGrowthScore: true,
      businessGoals: true,
    },
  });

  const latestSnapshot = await prisma.growthScoreSnapshot.findFirst({
    where: { websiteId: input.websiteId },
    orderBy: { createdAt: "desc" },
    select: {
      score: true,
      previousScore: true,
      delta: true,
    },
  });

  const latestAudit = await prisma.audit.findFirst({
    where: {
      websiteId: input.websiteId,
      status: AuditStatus.COMPLETED,
      deletedAt: null,
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      growthScore: true,
      completedAt: true,
      checks: {
        where: {
          severity: { in: [AuditCheckSeverity.CRITICAL, AuditCheckSeverity.HIGH] },
          status: { in: [AuditCheckStatus.FAIL, AuditCheckStatus.WARNING] },
        },
        select: {
          id: true,
          title: true,
          category: true,
          severity: true,
        },
        take: 20,
      },
    },
  });

  const criticalFindings =
    latestAudit?.checks.filter((c) => c.severity === AuditCheckSeverity.CRITICAL) ??
    [];
  const technicalFindings =
    latestAudit?.checks.filter((c) =>
      ["TECHNICAL", "PERFORMANCE", "SECURITY"].includes(c.category)
    ) ?? [];

  const tasks = await prisma.task.findMany({
    where: { websiteId: input.websiteId, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      priority: true,
      category: true,
      source: true,
      status: true,
      completedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const openTasks = tasks.filter((t) => t.status === TaskStatus.OPEN);
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS);
  const recentlyCompletedTasks = tasks.filter(
    (t) =>
      t.status === TaskStatus.COMPLETED &&
      t.completedAt &&
      t.completedAt >= recentStart
  );
  const highPriorityTasks = tasks.filter(
    (t) =>
      (t.status === TaskStatus.OPEN || t.status === TaskStatus.IN_PROGRESS) &&
      (t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH)
  );

  const gscIntegration = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
    },
    select: {
      status: true,
      lastErrorMessage: true,
      googleData: {
        select: { metricsJson: true, searchConsoleSiteUrl: true },
      },
    },
  });

  const gscConnected =
    gscIntegration?.status === IntegrationStatus.CONNECTED &&
    Boolean(gscIntegration.googleData?.searchConsoleSiteUrl?.trim());
  const gscError =
    gscIntegration?.status === IntegrationStatus.ERROR ||
    Boolean(gscIntegration?.lastErrorMessage);
  const gscMetrics = gscConnected
    ? extractGscMetricsSummary(gscIntegration?.googleData?.metricsJson)
    : null;

  const wpConnection = await prisma.wordPressConnection.findFirst({
    where: { websiteId: input.websiteId },
    select: { status: true },
  });

  const wordpressConnected =
    wpConnection?.status === WordPressConnectionStatus.CONNECTED;
  const wordpressError =
    wpConnection?.status === WordPressConnectionStatus.ERROR ||
    wpConnection?.status === WordPressConnectionStatus.DISCONNECTED;

  const articles = await prisma.article.findMany({
    where: { websiteId: input.websiteId, deletedAt: null },
    select: {
      id: true,
      title: true,
      status: true,
      targetKeyword: true,
      createdAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const draftArticles = articles.filter(
    (a) => a.status === ArticleStatus.DRAFT || a.status === ArticleStatus.IDEA
  );
  const waitingReviewArticles = articles.filter(
    (a) => a.status === ArticleStatus.WAITING_REVIEW
  );
  const recentlyCreatedArticles = articles.filter((a) => a.createdAt >= start);
  const wordpressDraftArticles = articles.filter(
    (a) => a.status === ArticleStatus.WORDPRESS_DRAFT_CREATED
  );

  const socialPosts = await prisma.socialPost.findMany({
    where: { websiteId: input.websiteId, deletedAt: null },
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const readySocialPosts = socialPosts.filter(
    (p) => p.status === SocialPostStatus.READY
  );
  const draftSocialPosts = socialPosts.filter(
    (p) => p.status === SocialPostStatus.DRAFT
  );
  const copiedSocialPosts = socialPosts.filter(
    (p) => p.status === SocialPostStatus.COPIED
  );

  const timelineEvents = await prisma.timelineEvent.findMany({
    where: {
      websiteId: input.websiteId,
      userId: input.userId,
      createdAt: { gte: recentStart },
    },
    select: {
      id: true,
      type: true,
      title: true,
      summary: true,
      severity: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const timelineWarnings = timelineEvents.filter(
    (e) =>
      e.severity === TimelineEventSeverity.WARNING ||
      e.severity === TimelineEventSeverity.ERROR
  );
  const timelineOpportunities = timelineEvents.filter(
    (e) => e.severity === TimelineEventSeverity.OPPORTUNITY
  );

  const opportunities = sortGrowthOpportunities(
    await syncGrowthOpportunitiesForWebsite({
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      userId: input.userId,
    })
  );

  const gscOpportunityCount = opportunities.filter((o) => o.type === "GSC").length;

  const monthlyPlan = await prisma.monthlyPlan.findUnique({
    where: {
      websiteId_month: {
        websiteId: input.websiteId,
        month: input.month,
      },
    },
    include: {
      _count: { select: { items: true } },
    },
  });

  const sourceSummary: MonthlyAutopilotSourceSummary = {
    hasAudit: Boolean(latestAudit),
    hasGsc: gscConnected,
    hasTasks: tasks.length > 0,
    hasArticles: articles.length > 0,
    hasSocialPosts: socialPosts.length > 0,
    hasTimelineEvents: timelineEvents.length > 0,
    hasOpportunities: opportunities.length > 0,
    hasEnoughData:
      Boolean(latestAudit) ||
      tasks.length > 0 ||
      gscConnected ||
      articles.length > 0 ||
      opportunities.length > 0,
  };

  return {
    website: {
      id: website.id,
      url: website.url,
      displayName: website.displayName,
      primaryLanguage: website.primaryLanguage,
      niche: website.niche,
      currentGrowthScore: website.currentGrowthScore,
      businessGoals: website.businessGoals,
    },
    month: input.month,
    growthScore: {
      latest: latestSnapshot?.score ?? website.currentGrowthScore,
      previous: latestSnapshot?.previousScore ?? null,
      delta: latestSnapshot?.delta ?? null,
    },
    audit: latestAudit
      ? {
          id: latestAudit.id,
          growthScore: latestAudit.growthScore,
          completedAt: latestAudit.completedAt,
          criticalFindings: criticalFindings.map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category,
          })),
          technicalFindings: technicalFindings.map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category,
          })),
        }
      : null,
    tasks: {
      open: openTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        category: t.category,
        source: t.source,
      })),
      inProgress: inProgressTasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        category: t.category,
      })),
      recentlyCompleted: recentlyCompletedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        completedAt: t.completedAt,
      })),
      highPriority: highPriorityTasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        category: t.category,
      })),
    },
    gsc: {
      connected: gscConnected,
      hasError: gscError,
      lastErrorMessage: gscIntegration?.lastErrorMessage ?? null,
      metricsSummary: gscMetrics,
      opportunityCount: gscOpportunityCount,
    },
    articles: {
      drafts: draftArticles.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        targetKeyword: a.targetKeyword,
      })),
      waitingReview: waitingReviewArticles.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
      })),
      recentlyCreated: recentlyCreatedArticles.map((a) => ({
        id: a.id,
        title: a.title,
        createdAt: a.createdAt,
      })),
      wordpressDrafts: wordpressDraftArticles.map((a) => ({
        id: a.id,
        title: a.title,
      })),
    },
    socialPosts: {
      ready: readySocialPosts.map((p) => ({
        id: p.id,
        title: p.title,
        platform: p.platform,
        status: p.status,
      })),
      drafts: draftSocialPosts.map((p) => ({
        id: p.id,
        title: p.title,
        platform: p.platform,
      })),
      copied: copiedSocialPosts.map((p) => ({
        id: p.id,
        title: p.title,
      })),
    },
    timeline: {
      recent: timelineEvents.map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        summary: e.summary,
        severity: e.severity,
        createdAt: e.createdAt,
      })),
      warnings: timelineWarnings.map((e) => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
      })),
      opportunities: timelineOpportunities.map((e) => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
      })),
    },
    integrations: {
      gscConnected,
      gscError,
      wordpressConnected,
      wordpressError,
    },
    opportunities: opportunities.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      priority: o.priority,
      type: o.type,
    })),
    contentPlan: {
      hasActivePlan: Boolean(monthlyPlan),
      planItemCount: monthlyPlan?._count.items ?? 0,
    },
    sourceSummary,
  };
}
