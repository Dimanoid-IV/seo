import "server-only";

import {
  ArticleStatus,
  AuditStatus,
  EmailApprovalStatus,
  IntegrationProvider,
  IntegrationStatus,
  MonthlyAutopilotStatus,
  SocialPostStatus,
  TaskPriority,
  TaskStatus,
  TimelineEventSeverity,
  WordPressConnectionStatus,
} from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { formatMonthlyAutopilotPlan } from "@/lib/autopilot/format";
import { currentMonthKey } from "@/lib/autopilot/month-utils";
import { parsePlanItemsDocument } from "@/lib/autopilot/plan-items";
import { findNextScheduledArticleAt } from "@/lib/dashboard/primary-cta";
import { getPrisma } from "@/lib/db";
import { resolveGscConnectionState } from "@/lib/integrations/gsc-state";
import { getSaasDictionary } from "@/lib/i18n/saas";
import { getCustomPublishingConfig } from "@/lib/publishing/custom-webhook-config";
import { formatTimelineEvent } from "@/lib/timeline/format";

import {
  buildRecommendedActions,
  countNeedsReview,
  emptyMetrics,
  resolveOverallStatus,
} from "./recommended-actions";
import { resolveWebsiteForControlCenter } from "./resolve-website";
import type {
  ApprovalQueueItem,
  AutopilotControlCenterViewModel,
  ControlCenterIntegration,
  ControlCenterRecentActivity,
} from "./types";
import { getAutopilotStatusSnapshot } from "@/lib/autopilot/autopilot-status";
import { getAutopilotSettings, autopilotModeToClient } from "@/lib/autopilot/autopilot-settings";

const IMPORTANT_SEVERITIES = new Set<TimelineEventSeverity>([
  TimelineEventSeverity.OPPORTUNITY,
  TimelineEventSeverity.WARNING,
  TimelineEventSeverity.ERROR,
  TimelineEventSeverity.SUCCESS,
]);

const IMPORTANT_EVENT_TYPES = new Set([
  "MONTHLY_AUTOPILOT_PLAN_CREATED",
  "EMAIL_APPROVAL_CREATED",
  "SOCIAL_POST_DRAFT_CREATED",
  "TASK_CREATED",
  "INTEGRATION_ERROR",
  "GSC_OPPORTUNITY_FOUND",
  "AUDIT_COMPLETED",
  "SCORE_CHANGED",
]);

function queuePriority(
  priority: "HIGH" | "MEDIUM" | "LOW"
): number {
  return priority === "HIGH" ? 0 : priority === "MEDIUM" ? 1 : 2;
}

export async function getAutopilotControlCenter(input: {
  currentUser: CurrentUser;
  websiteId?: string | null;
  locale?: import("@/lib/i18n/saas/locales").SaasLocale;
}): Promise<AutopilotControlCenterViewModel> {
  const locale = input.locale ?? "en";
  const resolved = await resolveWebsiteForControlCenter(
    input.currentUser.id,
    input.currentUser.organizationId,
    input.websiteId
  );

  if (!resolved) {
    return {
      website: null,
      status: resolveOverallStatus(
        {
          hasWebsite: false,
          hasAudit: false,
          hasUsefulData: false,
          needsReviewCount: 0,
          integrationIssuesCount: 0,
          monthlyPlanApproved: false,
        },
        locale
      ),
      metrics: emptyMetrics(),
      approvalQueue: [],
      recommendedActions: buildRecommendedActions(
        {
          hasMonthlyPlan: false,
          monthlyPlanApproved: false,
          pendingEmailsCount: 0,
          draftArticlesCount: 0,
          waitingReviewArticlesCount: 0,
          readySocialPostsCount: 0,
          highPriorityTasksCount: 0,
          gscConnected: false,
          gscError: false,
          hasAudit: false,
          unreadTimelineEventsCount: 0,
        },
        locale
      ),
      recentActivity: [],
      integrations: [],
    };
  }

  const { website } = resolved;
  const prisma = getPrisma();
  const month = currentMonthKey();
  const userId = input.currentUser.id;

  const [
    monthlyPlanRecord,
    pendingEmails,
    articles,
    socialPosts,
    tasks,
    timelineEvents,
    unreadTimelineCount,
    latestSnapshot,
    latestAudit,
    gscIntegration,
    wpConnection,
    customPublishing,
    hasAnyTasks,
    hasAnyArticles,
    autopilotStatus,
    autopilotSettings,
  ] = await Promise.all([
    prisma.monthlyAutopilotPlan.findFirst({
      where: {
        websiteId: website.id,
        userId,
        month,
        archivedAt: null,
      },
    }),
    prisma.emailApproval.findMany({
      where: {
        websiteId: website.id,
        userId,
        archivedAt: null,
        status: {
          in: [EmailApprovalStatus.DRAFT, EmailApprovalStatus.READY],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.article.findMany({
      where: {
        websiteId: website.id,
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
      select: { id: true, title: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),
    prisma.socialPost.findMany({
      where: {
        websiteId: website.id,
        deletedAt: null,
        status: {
          in: [SocialPostStatus.DRAFT, SocialPostStatus.READY],
        },
      },
      select: {
        id: true,
        title: true,
        platform: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.task.findMany({
      where: {
        websiteId: website.id,
        deletedAt: null,
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        description: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.timelineEvent.findMany({
      where: { websiteId: website.id, userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.timelineEvent.count({
      where: { websiteId: website.id, userId, isRead: false },
    }),
    prisma.growthScoreSnapshot.findFirst({
      where: { websiteId: website.id },
      orderBy: { createdAt: "desc" },
      select: { score: true, delta: true },
    }),
    prisma.audit.findFirst({
      where: {
        websiteId: website.id,
        status: AuditStatus.COMPLETED,
        deletedAt: null,
      },
      orderBy: { completedAt: "desc" },
      select: { id: true },
    }),
    prisma.integration.findFirst({
      where: {
        websiteId: website.id,
        provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      },
      select: {
        status: true,
        lastErrorMessage: true,
        googleData: { select: { searchConsoleSiteUrl: true } },
      },
    }),
    prisma.wordPressConnection.findFirst({
      where: { websiteId: website.id },
      select: { status: true },
    }),
    getCustomPublishingConfig(website.id),
    prisma.task.count({
      where: { websiteId: website.id, deletedAt: null },
    }),
    prisma.article.count({
      where: { websiteId: website.id, deletedAt: null },
    }),
    getAutopilotStatusSnapshot({
      currentUser: input.currentUser,
      websiteId: website.id,
    }),
    getAutopilotSettings({
      userId,
      organizationId: input.currentUser.organizationId,
      websiteId: website.id,
    }),
  ]);

  const monthlyPlan = monthlyPlanRecord
    ? formatMonthlyAutopilotPlan(monthlyPlanRecord)
    : null;
  const monthlyPlanApproved =
    monthlyPlanRecord?.status === MonthlyAutopilotStatus.APPROVED;
  const planItemsDocument = monthlyPlanRecord?.planItemsJson
    ? parsePlanItemsDocument(monthlyPlanRecord.planItemsJson)
    : null;
  const hasArticleTopics = Boolean(
    planItemsDocument?.items.some((item) => item.type === "ARTICLE")
  );
  const nextScheduledArticleAt = planItemsDocument
    ? findNextScheduledArticleAt(planItemsDocument.items)
    : null;
  const readyToPublishCount =
    planItemsDocument?.items.filter(
      (item) =>
        item.type === "ARTICLE" &&
        (item.pipelineState === "UNIVERSAL_PACKAGE_READY" ||
          item.pipelineState === "WORDPRESS_DRAFT_CREATED" ||
          item.pipelineState === "WEBHOOK_READY" ||
          item.pipelineState === "DRAFT_READY_FOR_REVIEW" ||
          item.pipelineState === "READY_FOR_PUBLISHING_HANDOFF" ||
          Boolean(item.universalPackagePreparedAt) ||
          Boolean(item.wordpressDraftCreatedAt))
    ).length ?? 0;
  const previewItems =
    planItemsDocument?.items
      .filter((item) =>
        ["ARTICLE", "SEO_FIX", "TASK_FIX", "SOCIAL_POST", "EMAIL"].includes(
          item.type
        )
      )
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        status: item.status,
        scheduledFor: item.scheduledFor ?? item.plannedPublishAt ?? null,
      })) ?? [];

  const gscSelectedProperty =
    gscIntegration?.googleData?.searchConsoleSiteUrl ?? null;
  const gscState = resolveGscConnectionState({
    integrationStatus: gscIntegration?.status,
    selectedProperty: gscSelectedProperty,
    hasError: Boolean(gscIntegration?.lastErrorMessage),
  });
  // "gscConnected" for recommendations/data means Google OAuth exists.
  const gscConnected = gscIntegration?.status === IntegrationStatus.CONNECTED;
  const gscFullyConnected = gscState === "CONNECTED";
  const gscNeedsProperty = gscState === "GOOGLE_CONNECTED_NO_PROPERTY";
  const gscError = gscState === "ERROR";

  const wordpressConnected =
    wpConnection?.status === WordPressConnectionStatus.CONNECTED;
  const customPublishingConnected = Boolean(
    customPublishing?.endpointConfigured && customPublishing.testedAt
  );
  const publishingConnected = wordpressConnected || customPublishingConnected;
  const wordpressError =
    wpConnection?.status === WordPressConnectionStatus.ERROR ||
    wpConnection?.status === WordPressConnectionStatus.DISCONNECTED;

  const highPriorityTasks = tasks.filter(
    (t) =>
      t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH
  );

  const waitingReviewArticles = articles.filter(
    (a) => a.status === ArticleStatus.WAITING_REVIEW
  );
  const draftArticles = articles.filter(
    (a) => a.status === ArticleStatus.DRAFT || a.status === ArticleStatus.IDEA
  );
  const wpDraftArticles = articles.filter(
    (a) => a.status === ArticleStatus.WORDPRESS_DRAFT_CREATED
  );
  const readySocialPosts = socialPosts.filter(
    (p) => p.status === SocialPostStatus.READY
  );

  let integrationIssuesCount = 0;
  if (!gscConnected) integrationIssuesCount += 1;
  if (gscError) integrationIssuesCount += 1;
  if (!publishingConnected) integrationIssuesCount += 1;
  if (wordpressError) integrationIssuesCount += 1;

  const dict = getSaasDictionary(locale);
  const integrationStrings = dict.controlCenter.integrations;
  const queueStrings = dict.controlCenter.approvalQueue;

  const integrations: ControlCenterIntegration[] = [
    {
      key: "google_search_console",
      name: "Google Search Console",
      status: gscError
        ? "ERROR"
        : gscNeedsProperty
          ? "NEEDS_SETUP"
          : gscFullyConnected
            ? "CONNECTED"
            : "MISSING",
      description: gscError
        ? integrationStrings.gscErrorDesc
        : gscNeedsProperty
          ? integrationStrings.gscNeedsPropertyDesc
          : gscFullyConnected
            ? integrationStrings.gscConnectedDesc
            : integrationStrings.gscNotConnectedDesc,
      href: "/app/integrations",
    },
    {
      key: "wordpress",
      name: "WordPress",
      status: wordpressError
        ? "ERROR"
        : wordpressConnected
          ? "CONNECTED"
          : "MISSING",
      description: wordpressError
        ? integrationStrings.wpErrorDesc
        : wordpressConnected
          ? integrationStrings.wpConnectedDesc
          : integrationStrings.wpNotConnectedDesc,
      href: "/app/integrations",
    },
    {
      key: "custom_publishing",
      name: "Custom site publishing",
      status: customPublishingConnected ? "CONNECTED" : "MISSING",
      description: customPublishingConnected
        ? integrationStrings.customPublishingConnectedDesc
        : integrationStrings.customPublishingNotConnectedDesc,
      href: "/app/integrations",
    },
  ];

  const approvalQueue: ApprovalQueueItem[] = [];

  if (
    monthlyPlan &&
    monthlyPlan.status !== "approved" &&
    monthlyPlan.status !== "archived"
  ) {
    approvalQueue.push({
      id: monthlyPlan.id,
      type: "MONTHLY_PLAN",
      title: monthlyPlan.title,
      description: queueStrings.descriptions.monthlyPlan(month),
      status: monthlyPlan.status,
      priority: "HIGH",
      href: "/app/autopilot",
      actionLabel: queueStrings.actions.openAutopilot,
      actionType: "link",
    });
  }

  for (const email of pendingEmails) {
    approvalQueue.push({
      id: email.id,
      type: "EMAIL",
      title: email.subject,
      description: queueStrings.descriptions.email,
      status: email.status.toLowerCase(),
      priority: "HIGH",
      href: "/app/email-approvals",
      actionLabel: queueStrings.actions.reviewEmail,
      actionType: "link",
    });
  }

  for (const article of waitingReviewArticles.slice(0, 5)) {
    approvalQueue.push({
      id: article.id,
      type: "ARTICLE",
      title: article.title,
      description: queueStrings.descriptions.articleWaiting,
      status: article.status.toLowerCase(),
      priority: "HIGH",
      href: `/app/articles/${article.id}`,
      actionLabel: queueStrings.actions.openArticle,
      actionType: "link",
    });
  }

  for (const article of wpDraftArticles.slice(0, 3)) {
    approvalQueue.push({
      id: article.id,
      type: "WORDPRESS_DRAFT",
      title: article.title,
      description: queueStrings.descriptions.wordpressDraft,
      status: "wordpress_draft",
      priority: "MEDIUM",
      href: `/app/articles/${article.id}`,
      actionLabel: queueStrings.actions.openArticle,
      actionType: "link",
    });
  }

  for (const article of draftArticles.slice(0, 3)) {
    if (approvalQueue.some((q) => q.id === article.id)) continue;
    approvalQueue.push({
      id: article.id,
      type: "ARTICLE",
      title: article.title,
      description: queueStrings.descriptions.articleDraft,
      status: article.status.toLowerCase(),
      priority: "MEDIUM",
      href: `/app/articles/${article.id}`,
      actionLabel: queueStrings.actions.openArticle,
      actionType: "link",
    });
  }

  for (const post of readySocialPosts.slice(0, 5)) {
    approvalQueue.push({
      id: post.id,
      type: "SOCIAL_POST",
      title: post.title ?? `${post.platform} post draft`,
      description: queueStrings.descriptions.social,
      status: post.status.toLowerCase(),
      priority: "MEDIUM",
      href: "/app/social-posts",
      actionLabel: queueStrings.actions.openSocialPosts,
      actionType: "link",
    });
  }

  for (const task of highPriorityTasks.slice(0, 5)) {
    approvalQueue.push({
      id: task.id,
      type: "TASK",
      title: task.title,
      description: task.description ?? queueStrings.descriptions.taskFallback,
      status: task.status.toLowerCase(),
      priority: "HIGH",
      href: "/app/tasks",
      actionLabel: queueStrings.actions.openTasks,
      actionType: "link",
    });
  }

  if (gscError) {
    approvalQueue.push({
      id: "integration-gsc",
      type: "INTEGRATION",
      title: queueStrings.itemTitles.gscIssue,
      description:
        gscIntegration?.lastErrorMessage ?? queueStrings.descriptions.gscIssue,
      status: "error",
      priority: "HIGH",
      href: "/app/integrations",
      actionLabel: queueStrings.actions.openIntegrations,
      actionType: "link",
    });
  } else if (!gscConnected) {
    approvalQueue.push({
      id: "integration-gsc-missing",
      type: "INTEGRATION",
      title: queueStrings.itemTitles.gscMissing,
      description: queueStrings.descriptions.gscMissing,
      status: "missing",
      priority: "MEDIUM",
      href: "/app/integrations",
      actionLabel: queueStrings.actions.connect,
      actionType: "link",
    });
  }

  approvalQueue.sort(
    (a, b) => queuePriority(a.priority) - queuePriority(b.priority)
  );

  const hasUsefulData =
    Boolean(latestAudit) ||
    hasAnyTasks > 0 ||
    hasAnyArticles > 0 ||
    gscConnected ||
    Boolean(monthlyPlan) ||
    pendingEmails.length > 0;

  const status = resolveOverallStatus(
    {
      hasWebsite: true,
      hasAudit: Boolean(latestAudit),
      hasUsefulData,
      needsReviewCount: countNeedsReview(approvalQueue),
      integrationIssuesCount: gscError || wordpressError ? 1 : 0,
      monthlyPlanApproved,
    },
    locale
  );

  const metrics = {
    growthScore: latestSnapshot?.score ?? website.currentGrowthScore ?? undefined,
    growthScoreDelta: latestSnapshot?.delta ?? undefined,
    openTasksCount: tasks.length,
    highPriorityTasksCount: highPriorityTasks.length,
    pendingEmailsCount: pendingEmails.length,
    draftArticlesCount: draftArticles.length + waitingReviewArticles.length,
    readySocialPostsCount: readySocialPosts.length,
    integrationIssuesCount,
    unreadTimelineEventsCount: unreadTimelineCount,
  };

  const recommendedActions = buildRecommendedActions(
    {
      hasMonthlyPlan: Boolean(monthlyPlan),
      monthlyPlanApproved,
      pendingEmailsCount: pendingEmails.length,
      draftArticlesCount: draftArticles.length,
      waitingReviewArticlesCount: waitingReviewArticles.length,
      readySocialPostsCount: readySocialPosts.length,
      highPriorityTasksCount: highPriorityTasks.length,
      gscConnected,
      gscError,
      hasAudit: Boolean(latestAudit),
      unreadTimelineEventsCount: unreadTimelineCount,
    },
    locale
  );

  const recentActivity: ControlCenterRecentActivity[] = timelineEvents
    .filter(
      (event) =>
        IMPORTANT_SEVERITIES.has(event.severity) ||
        IMPORTANT_EVENT_TYPES.has(event.type)
    )
    .slice(0, 8)
    .map((event) => {
      const formatted = formatTimelineEvent(event, locale);
      return {
        id: formatted.id,
        title: formatted.title,
        summary: formatted.summary,
        severity: formatted.severity,
        source: formatted.source,
        createdAt: formatted.createdAt,
        href: formatted.action?.href,
      };
    });

  return {
    website: {
      id: website.id,
      name: website.displayName ?? undefined,
      domain: website.url.replace(/^https?:\/\//, ""),
    },
    status,
    metrics,
    monthlyPlan: monthlyPlan
      ? {
          id: monthlyPlan.id,
          month: monthlyPlan.month,
          status: monthlyPlan.status,
          title: monthlyPlan.title,
          summary: monthlyPlan.summary,
          href: "/app/autopilot",
          hasArticleTopics,
          nextScheduledArticleAt,
          readyToPublishCount,
          previewItems,
        }
      : undefined,
    approvalQueue,
    recommendedActions,
    recentActivity,
    integrations,
    autopilotStatus,
    autopilotSettings: {
      mode: autopilotModeToClient(autopilotSettings.mode),
      websiteId: autopilotSettings.websiteId,
      autopublishAvailable: autopilotSettings.autopublishAvailable,
      livePublishPaused: autopilotSettings.livePublishPaused,
      livePublishPausedAt: autopilotSettings.livePublishPausedAt,
      livePublishPauseReason: autopilotSettings.livePublishPauseReason,
    },
  };
}
