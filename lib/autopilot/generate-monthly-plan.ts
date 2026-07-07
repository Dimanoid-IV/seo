import "server-only";

import {
  MonthlyAutopilotStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { assertUsageLimit, recordUsage } from "@/lib/billing/feature-gates";

import { formatMonthlyAutopilotPlan } from "./format";
import { timelineAfterMonthlyAutopilotPlanCreated } from "./hooks";
import { formatAutopilotMonth } from "./month-utils";
import { resolveWebsiteForAutopilot } from "./resolve-website";
import { SCORE_WEIGHTS, scoreToPriority } from "./scoring";
import {
  getMonthlyAutopilotSourceData,
  type MonthlyAutopilotSourceData,
} from "./source-data";
import type {
  AutopilotFocusArea,
  AutopilotNextStep,
  AutopilotRecommendedAction,
  AutopilotRisk,
  MonthlyAutopilotMetrics,
  MonthlyAutopilotPlanViewModel,
} from "./types";

let actionCounter = 0;

function nextActionId(): string {
  actionCounter += 1;
  return `action-${actionCounter}`;
}

function buildMetrics(data: MonthlyAutopilotSourceData): MonthlyAutopilotMetrics {
  return {
    growthScore: data.growthScore.latest ?? undefined,
    growthScoreDelta: data.growthScore.delta ?? undefined,
    openTasksCount: data.tasks.open.length + data.tasks.inProgress.length,
    completedTasksCount: data.tasks.recentlyCompleted.length,
    opportunitiesCount: data.opportunities.length,
    warningsCount: data.timeline.warnings.length,
    draftArticlesCount: data.articles.drafts.length,
    readySocialPostsCount: data.socialPosts.ready.length,
  };
}

function buildFocusAreas(data: MonthlyAutopilotSourceData): AutopilotFocusArea[] {
  const areas: Array<AutopilotFocusArea & { score: number }> = [];

  const criticalCount = data.audit?.criticalFindings.length ?? 0;
  const technicalCount = data.audit?.technicalFindings.length ?? 0;
  const highPriorityTaskIds = data.tasks.highPriority.map((t) => t.id);

  if (criticalCount > 0 || technicalCount > 0 || highPriorityTaskIds.length > 0) {
    const score =
      (criticalCount > 0 ? SCORE_WEIGHTS.criticalAuditIssue : 0) +
      (highPriorityTaskIds.length > 0 ? SCORE_WEIGHTS.highPriorityTask : 0);
    areas.push({
      id: "technical-seo",
      title: "Technical SEO",
      description:
        "Fix technical issues that may limit search visibility and crawlability.",
      priority: scoreToPriority(score || SCORE_WEIGHTS.highPriorityTask),
      reason:
        criticalCount > 0
          ? `${criticalCount} critical audit finding${criticalCount > 1 ? "s" : ""} need attention.`
          : `${highPriorityTaskIds.length} high-priority technical task${highPriorityTaskIds.length !== 1 ? "s" : ""} ${highPriorityTaskIds.length === 1 ? "is" : "are"} open.`,
      reasonKey:
        criticalCount > 0
          ? "criticalFindings"
          : highPriorityTaskIds.length === 1
            ? "highPriorityTasksOne"
            : "highPriorityTasksMany",
      reasonParams: {
        count: criticalCount > 0 ? criticalCount : highPriorityTaskIds.length,
      },
      relatedTaskIds: highPriorityTaskIds.slice(0, 5),
      score: score || SCORE_WEIGHTS.highPriorityTask,
    });
  }

  if (data.gsc.connected && (data.gsc.opportunityCount > 0 || data.opportunities.some((o) => o.type === "GSC"))) {
    const gscOpps = data.opportunities.filter((o) => o.type === "GSC");
    areas.push({
      id: "gsc-opportunities",
      title: "Search Console Opportunities",
      description:
        "Improve pages and queries that already get impressions but can perform better.",
      priority: scoreToPriority(SCORE_WEIGHTS.gscOpportunity),
      reason:
        data.gsc.opportunityCount > 0
          ? `${data.gsc.opportunityCount} Search Console opportunit${data.gsc.opportunityCount === 1 ? "y" : "ies"} found.`
          : "Search Console data shows pages with growth potential.",
      reasonKey:
        data.gsc.opportunityCount > 0 ? "foundMany" : "potential",
      reasonParams: { count: data.gsc.opportunityCount },
      relatedTimelineEventIds: data.timeline.opportunities.slice(0, 3).map((e) => e.id),
      score: SCORE_WEIGHTS.gscOpportunity,
    });
    void gscOpps;
  }

  if (
    data.articles.drafts.length > 0 ||
    data.contentPlan.hasActivePlan ||
    data.opportunities.some((o) => o.type === "CONTENT")
  ) {
    areas.push({
      id: "content-production",
      title: "Content Production",
      description:
        "Create and finish content that supports keywords and customer questions.",
      priority: scoreToPriority(
        data.articles.drafts.length > 0
          ? SCORE_WEIGHTS.articleReadyForReview
          : 12
      ),
      reason:
        data.articles.drafts.length > 0
          ? `${data.articles.drafts.length} article draft${data.articles.drafts.length !== 1 ? "s" : ""} need progress.`
          : "Content gaps were identified from audit and growth data.",
      reasonKey:
        data.articles.drafts.length > 0 ? "draftsNeedProgress" : "gapsFromAudit",
      reasonParams: { count: data.articles.drafts.length },
      relatedArticleIds: data.articles.drafts.slice(0, 5).map((a) => a.id),
      score: data.articles.drafts.length > 0 ? SCORE_WEIGHTS.articleReadyForReview : 12,
    });
  }

  if (
    data.socialPosts.ready.length > 0 ||
    data.articles.drafts.length > 0 ||
    data.articles.waitingReview.length > 0
  ) {
    areas.push({
      id: "social-distribution",
      title: "Social Distribution",
      description:
        "Promote ready content with social post drafts tailored to your audience.",
      priority: scoreToPriority(
        data.socialPosts.ready.length > 0 ? SCORE_WEIGHTS.socialPostReady : 12
      ),
      reason:
        data.socialPosts.ready.length > 0
          ? `${data.socialPosts.ready.length} social post${data.socialPosts.ready.length !== 1 ? "s" : ""} ready for review.`
          : "New content can be supported with social posts.",
      reasonKey:
        data.socialPosts.ready.length > 0 ? "readyMany" : "newContent",
      reasonParams: { count: data.socialPosts.ready.length },
      relatedSocialPostIds: data.socialPosts.ready.slice(0, 5).map((p) => p.id),
      relatedArticleIds: data.articles.waitingReview.slice(0, 3).map((a) => a.id),
      score: data.socialPosts.ready.length > 0 ? SCORE_WEIGHTS.socialPostReady : 12,
    });
  }

  if (
    !data.integrations.gscConnected ||
    data.integrations.gscError ||
    !data.integrations.wordpressConnected ||
    data.integrations.wordpressError ||
    !data.sourceSummary.hasEnoughData
  ) {
    let score = 0;
    if (!data.integrations.gscConnected) {
      score += SCORE_WEIGHTS.noGscConnection;
    }
    if (data.integrations.gscError) {
      score += SCORE_WEIGHTS.integrationError;
    }
    if (!data.integrations.wordpressConnected) {
      score += SCORE_WEIGHTS.noWordPressConnection;
    }
    if (!data.audit) {
      score += SCORE_WEIGHTS.staleAudit;
    }

    areas.push({
      id: "integration-data",
      title: "Integration & Data Quality",
      description:
        "Connect integrations and refresh data so RankBoost can give better recommendations.",
      priority: scoreToPriority(score || SCORE_WEIGHTS.noGscConnection),
      reason: !data.integrations.gscConnected
        ? "Google Search Console is not connected."
        : "Some integrations need attention or more data.",
      reasonKey: !data.integrations.gscConnected ? "gscNotConnected" : "needsAttention",
      score: score || SCORE_WEIGHTS.noGscConnection,
    });
  }

  if (
    data.articles.waitingReview.length > 0 ||
    data.socialPosts.ready.length > 0 ||
    data.articles.wordpressDrafts.length > 0
  ) {
    const waitingCount =
      data.articles.waitingReview.length +
      data.socialPosts.ready.length +
      data.articles.wordpressDrafts.length;

    areas.push({
      id: "review-approval",
      title: "Review & Approval",
      description:
        "Review AI-generated drafts before publishing or sharing externally.",
      priority: scoreToPriority(SCORE_WEIGHTS.articleReadyForReview),
      reason: `${waitingCount} item(s) waiting for your review.`,
      reasonKey: "waitingMany",
      reasonParams: { count: waitingCount },
      relatedArticleIds: [
        ...data.articles.waitingReview.map((a) => a.id),
        ...data.articles.wordpressDrafts.map((a) => a.id),
      ].slice(0, 5),
      relatedSocialPostIds: data.socialPosts.ready.slice(0, 3).map((p) => p.id),
      score: SCORE_WEIGHTS.articleReadyForReview,
    });
  }

  return areas
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score, ...area }) => {
      void score;
      return area;
    });
}

function buildRecommendedActions(
  data: MonthlyAutopilotSourceData
): AutopilotRecommendedAction[] {
  actionCounter = 0;
  const actions: AutopilotRecommendedAction[] = [];

  for (const task of data.tasks.highPriority.slice(0, 3)) {
    actions.push({
      id: nextActionId(),
      title: task.title,
      description: `High-priority ${task.category.toLowerCase()} task from ${task.priority.toLowerCase()} queue.`,
      type: "TASK",
      priority: scoreToPriority(SCORE_WEIGHTS.highPriorityTask),
      href: "/app",
    });
  }

  for (const article of data.articles.waitingReview.slice(0, 2)) {
    actions.push({
      id: nextActionId(),
      title: `Review: ${article.title}`,
      description: "Article draft is waiting for your review.",
      type: "REVIEW",
      priority: scoreToPriority(SCORE_WEIGHTS.articleReadyForReview),
      href: `/app/articles/${article.id}`,
    });
  }

  for (const article of data.articles.drafts.slice(0, 2)) {
    actions.push({
      id: nextActionId(),
      title: `Continue: ${article.title}`,
      description: "Finish this article draft for your content plan.",
      type: "ARTICLE",
      priority: "MEDIUM",
      href: `/app/articles/${article.id}`,
    });
  }

  for (const post of data.socialPosts.ready.slice(0, 2)) {
    actions.push({
      id: nextActionId(),
      title: post.title ?? "Review social post draft",
      description: "Ready social post draft — copy and publish manually.",
      type: "SOCIAL_POST",
      priority: scoreToPriority(SCORE_WEIGHTS.socialPostReady),
      href: "/app/social-posts",
    });
  }

  if (!data.integrations.gscConnected) {
    actions.push({
      id: nextActionId(),
      title: "Connect Google Search Console",
      description: "Unlock search query and page performance insights.",
      type: "INTEGRATION",
      priority: scoreToPriority(SCORE_WEIGHTS.noGscConnection),
      href: "/app/integrations",
    });
  }

  if (data.opportunities.length > 0) {
    actions.push({
      id: nextActionId(),
      title: data.opportunities[0].title,
      description: data.opportunities[0].description,
      type: "REVIEW",
      priority: data.opportunities[0].priority as AutopilotRecommendedAction["priority"],
      href: "/app",
    });
  }

  if (!data.audit) {
    actions.push({
      id: nextActionId(),
      title: "Run a website audit",
      description: "Refresh technical SEO findings and Growth Score.",
      type: "REPORT",
      priority: scoreToPriority(SCORE_WEIGHTS.staleAudit),
      href: "/app",
    });
  } else {
    actions.push({
      id: nextActionId(),
      title: "View monthly report",
      description: "Review progress and metrics for this website.",
      type: "REPORT",
      priority: "LOW",
      href: "/app/reports",
    });
  }

  return actions.slice(0, 10);
}

function buildRisks(data: MonthlyAutopilotSourceData): AutopilotRisk[] {
  const risks: AutopilotRisk[] = [];

  if (!data.integrations.gscConnected) {
    risks.push({
      title: "Search Console not connected",
      description:
        "Without GSC data, RankBoost cannot surface query and page opportunities.",
      severity: "WARNING",
    });
  }

  if (data.integrations.gscError) {
    risks.push({
      title: "Search Console sync issue",
      description:
        data.gsc.lastErrorMessage ??
        "Google Search Console integration reported an error.",
      severity: "ERROR",
    });
  }

  if (data.growthScore.delta != null && data.growthScore.delta < 0) {
    risks.push({
      title: "Growth Score declined",
      description: `Your Growth Score dropped by ${Math.abs(data.growthScore.delta)} points recently.`,
      severity: "WARNING",
    });
  }

  if (data.tasks.highPriority.length >= 5) {
    risks.push({
      title: "Many high-priority tasks open",
      description: `${data.tasks.highPriority.length} high-priority tasks need attention this month.`,
      severity: "WARNING",
    });
  }

  if (data.articles.waitingReview.length > 0) {
    risks.push({
      title: "Content drafts waiting for review",
      description: `${data.articles.waitingReview.length} article draft(s) are ready but not approved.`,
      severity: "WARNING",
    });
  }

  if (data.integrations.wordpressError) {
    risks.push({
      title: "WordPress connection issue",
      description: "WordPress integration may need reconnection or attention.",
      severity: "WARNING",
    });
  }

  if (!data.sourceSummary.hasEnoughData) {
    risks.push({
      title: "Limited growth data",
      description:
        "Run an audit or connect integrations to improve plan quality.",
      severity: "WARNING",
    });
  }

  return risks.slice(0, 6);
}

function buildNextSteps(data: MonthlyAutopilotSourceData): AutopilotNextStep[] {
  const steps: AutopilotNextStep[] = [];

  if (data.tasks.highPriority.length > 0) {
    steps.push({
      title: "Review high-priority tasks",
      description: "Start with the highest-impact SEO fixes on your dashboard.",
      href: "/app",
    });
  }

  if (data.articles.waitingReview.length > 0 || data.articles.drafts.length > 0) {
    steps.push({
      title: "Approve or edit content drafts",
      description: "Review AI-generated articles before publishing.",
      href: "/app/content-plan",
    });
  }

  if (data.socialPosts.ready.length > 0) {
    steps.push({
      title: "Copy ready social posts",
      description: "Paste reviewed drafts into your social accounts manually.",
      href: "/app/social-posts",
    });
  }

  if (!data.integrations.gscConnected) {
    steps.push({
      title: "Connect missing integrations",
      description: "Link Google Search Console for search performance data.",
      href: "/app/integrations",
    });
  }

  if (!data.audit) {
    steps.push({
      title: "Run a new audit",
      description: "Refresh technical findings and Growth Score baseline.",
      href: "/app",
    });
  }

  steps.push({
    title: "Check the timeline",
    description: "See what changed while you were away.",
    href: "/app/timeline",
  });

  return steps.slice(0, 6);
}

function buildDeterministicSummary(
  data: MonthlyAutopilotSourceData,
  focusAreas: AutopilotFocusArea[],
  metrics: MonthlyAutopilotMetrics
): string {
  const focusTitles = focusAreas.slice(0, 3).map((a) => a.title.toLowerCase());
  const focusPart =
    focusTitles.length > 0
      ? `Focus on ${focusTitles.join(", ")}.`
      : "Focus on foundational SEO and content improvements.";

  const parts = [
    `This month, ${focusPart}`,
    `RankBoost found ${metrics.opportunitiesCount} growth opportunit${metrics.opportunitiesCount === 1 ? "y" : "ies"}`,
  ];

  const reviewCount =
    data.articles.waitingReview.length + data.socialPosts.ready.length;
  if (reviewCount > 0) {
    parts.push(`${reviewCount} item${reviewCount !== 1 ? "s" : ""} waiting for your review`);
  }

  if (metrics.openTasksCount > 0) {
    parts.push(`${metrics.openTasksCount} open task${metrics.openTasksCount !== 1 ? "s" : ""} to address`);
  }

  return `${parts.join(" and ")}.`;
}

function collectRelatedIds(
  focusAreas: AutopilotFocusArea[],
  data: MonthlyAutopilotSourceData
) {
  const taskIds = new Set<string>();
  const articleIds = new Set<string>();
  const socialPostIds = new Set<string>();
  const timelineEventIds = new Set<string>();

  for (const area of focusAreas) {
    area.relatedTaskIds?.forEach((id) => taskIds.add(id));
    area.relatedArticleIds?.forEach((id) => articleIds.add(id));
    area.relatedSocialPostIds?.forEach((id) => socialPostIds.add(id));
    area.relatedTimelineEventIds?.forEach((id) => timelineEventIds.add(id));
  }

  data.tasks.highPriority.slice(0, 5).forEach((t) => taskIds.add(t.id));
  data.articles.drafts.slice(0, 5).forEach((a) => articleIds.add(a.id));
  data.socialPosts.ready.slice(0, 5).forEach((p) => socialPostIds.add(p.id));
  data.timeline.recent.slice(0, 5).forEach((e) => timelineEventIds.add(e.id));

  return {
    taskIds: [...taskIds],
    articleIds: [...articleIds],
    socialPostIds: [...socialPostIds],
    timelineEventIds: [...timelineEventIds],
  };
}

function buildPlanPayload(data: MonthlyAutopilotSourceData, month: string) {
  const metrics = buildMetrics(data);
  const focusAreas = buildFocusAreas(data);
  const recommendedActions = buildRecommendedActions(data);
  const risks = buildRisks(data);
  const nextSteps = buildNextSteps(data);
  const summary = buildDeterministicSummary(data, focusAreas, metrics);
  const relatedIds = collectRelatedIds(focusAreas, data);
  const monthLabel = formatAutopilotMonth(month);
  const websiteLabel = data.website.displayName ?? data.website.url;

  return {
    title: `Monthly growth plan — ${monthLabel}`,
    summary,
    status: MonthlyAutopilotStatus.READY,
    metrics,
    focusAreas,
    recommendedActions,
    risks,
    nextSteps,
    relatedIds,
    websiteLabel,
  };
}

export async function generateMonthlyAutopilotPlan(input: {
  userId: string;
  organizationId: string | null;
  websiteId?: string | null;
  month?: string;
  forceRegenerate?: boolean;
}): Promise<{
  plan: MonthlyAutopilotPlanViewModel;
  created: boolean;
  hermesSummaryUsed: boolean;
}> {
  const { normalizeMonthKey } = await import("./month-utils");
  const month = normalizeMonthKey(input.month);

  const { organization, website } = await resolveWebsiteForAutopilot(
    input.userId,
    input.organizationId,
    input.websiteId
  );

  const prisma = getPrisma();

  const existing = await prisma.monthlyAutopilotPlan.findUnique({
    where: {
      websiteId_month: {
        websiteId: website.id,
        month,
      },
    },
  });

  if (existing && !input.forceRegenerate) {
    return {
      plan: formatMonthlyAutopilotPlan(existing),
      created: false,
      hermesSummaryUsed: false,
    };
  }

  if (existing?.status === MonthlyAutopilotStatus.APPROVED && input.forceRegenerate) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Approved monthly plans cannot be regenerated."
    );
  }

  const sourceData = await getMonthlyAutopilotSourceData({
    userId: input.userId,
    websiteId: website.id,
    organizationId: organization.id,
    month,
  });

  const payload = buildPlanPayload(sourceData, month);

  const planData = {
    userId: input.userId,
    websiteId: website.id,
    organizationId: organization.id,
    month,
    status: payload.status,
    title: payload.title,
    summary: payload.summary,
    focusAreasJson: payload.focusAreas as Prisma.InputJsonValue,
    metricsJson: payload.metrics as Prisma.InputJsonValue,
    taskIds: payload.relatedIds.taskIds,
    articleIds: payload.relatedIds.articleIds,
    socialPostIds: payload.relatedIds.socialPostIds,
    timelineEventIds: payload.relatedIds.timelineEventIds,
    recommendationsJson: payload.recommendedActions as Prisma.InputJsonValue,
    risksJson: payload.risks as Prisma.InputJsonValue,
    nextActionsJson: payload.nextSteps as Prisma.InputJsonValue,
    generatedBy: "system",
  };

  let plan;
  const isUpdate =
    existing &&
    (existing.status === MonthlyAutopilotStatus.DRAFT ||
      existing.status === MonthlyAutopilotStatus.READY);

  if (!isUpdate) {
    await assertUsageLimit({
      userId: input.userId,
      organizationId: organization.id,
      websiteId: website.id,
      key: "MONTHLY_AUTOPILOT",
      message:
        "You've reached the monthly autopilot plan limit for your current plan. Upgrade to continue.",
    });
  }

  if (isUpdate) {
    plan = await prisma.monthlyAutopilotPlan.update({
      where: { id: existing.id },
      data: planData,
    });
  } else if (existing?.status === MonthlyAutopilotStatus.ARCHIVED) {
    plan = await prisma.monthlyAutopilotPlan.create({ data: planData });
  } else if (existing) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Cannot regenerate this monthly plan."
    );
  } else {
    plan = await prisma.monthlyAutopilotPlan.create({ data: planData });
  }

  const created = !isUpdate;

  if (created) {
    await recordUsage({
      userId: input.userId,
      organizationId: organization.id,
      websiteId: website.id,
      key: "MONTHLY_AUTOPILOT",
    });

    try {
      await timelineAfterMonthlyAutopilotPlanCreated({
        userId: input.userId,
        websiteId: website.id,
        planId: plan.id,
        month,
        focusAreasCount: payload.focusAreas.length,
        recommendedActionsCount: payload.recommendedActions.length,
      });
    } catch {
      // Timeline must not block plan generation.
    }
  }

  return {
    plan: formatMonthlyAutopilotPlan(plan),
    created,
    hermesSummaryUsed: false,
  };
}
