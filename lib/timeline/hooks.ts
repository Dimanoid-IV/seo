import {
  TimelineEventSeverity,
  TimelineEventSource,
  TimelineEventType,
} from "@prisma/client";

import type { GscInsight } from "@/lib/integrations/gsc-types";

import { createTimelineEvent, createTimelineEvents } from "./create-event";

const MAX_GSC_TIMELINE_EVENTS = 3;

export async function timelineAfterAuditCompleted(input: {
  userId: string;
  websiteId: string;
  growthScore: number;
  tasksCreated?: number;
  findingsCount?: number;
}) {
  const summaryParts = [
    "RankBoost scanned your website and updated its recommendations.",
  ];

  if (input.findingsCount && input.findingsCount > 0) {
    summaryParts.push(`${input.findingsCount} findings need attention.`);
  }
  if (input.tasksCreated && input.tasksCreated > 0) {
    summaryParts.push(`${input.tasksCreated} new tasks were created.`);
  }

  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.AUDIT_COMPLETED,
    source: TimelineEventSource.AUDIT_ENGINE,
    severity: TimelineEventSeverity.SUCCESS,
    title: "Website audit completed",
    summary: summaryParts.join(" "),
    details: {
      growthScore: input.growthScore,
      tasksCreated: input.tasksCreated ?? 0,
      findingsCount: input.findingsCount ?? 0,
    },
  });
}

export async function timelineAfterScoreChanged(input: {
  userId: string;
  websiteId: string;
  previousScore: number | null;
  newScore: number;
  delta: number | null;
}) {
  if (input.delta == null || input.delta === 0) {
    return;
  }

  const delta = input.delta;
  const direction = delta > 0 ? "increased" : "decreased";

  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.SCORE_CHANGED,
    source: TimelineEventSource.GROWTH_SCORE,
    severity:
      delta > 0
        ? TimelineEventSeverity.SUCCESS
        : TimelineEventSeverity.WARNING,
    title: "Growth Score changed",
    summary: `Your Growth Score ${direction} from ${input.previousScore ?? "—"} to ${input.newScore} (${delta > 0 ? "+" : ""}${delta}).`,
    details: {
      previousScore: input.previousScore,
      newScore: input.newScore,
      delta,
    },
  });
}

export async function timelineAfterTaskCreated(input: {
  userId: string;
  websiteId: string;
  taskId: string;
  title: string;
  source: TimelineEventSource;
  summary?: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.TASK_CREATED,
    source: input.source,
    severity: TimelineEventSeverity.OPPORTUNITY,
    title:
      input.source === TimelineEventSource.GSC
        ? "Search Console insight converted into a task"
        : "New growth task created",
    summary: input.summary ?? input.title,
    relatedTaskId: input.taskId,
  });
}

export async function timelineAfterTasksCreatedBatch(input: {
  userId: string;
  websiteId: string;
  tasks: Array<{ id: string; title: string }>;
  source: TimelineEventSource;
}) {
  await createTimelineEvents(
    input.tasks.map((task) => ({
      userId: input.userId,
      websiteId: input.websiteId,
      type: TimelineEventType.TASK_CREATED,
      source: input.source,
      severity: TimelineEventSeverity.OPPORTUNITY,
      title:
        input.source === TimelineEventSource.GSC
          ? "Search Console insight converted into a task"
          : "New growth task created",
      summary: task.title,
      relatedTaskId: task.id,
    }))
  );
}

export async function timelineAfterTaskCompleted(input: {
  userId: string;
  websiteId: string;
  taskId: string;
  title: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.TASK_COMPLETED,
    source: TimelineEventSource.TASKS,
    severity: TimelineEventSeverity.SUCCESS,
    title: "Task completed",
    summary: input.title,
    relatedTaskId: input.taskId,
  });
}

export async function timelineAfterGscInsights(input: {
  userId: string;
  websiteId: string;
  insights: GscInsight[];
}) {
  const opportunityInsights = input.insights.filter(
    (insight) => insight.type === "opportunity" || insight.type === "warning"
  );

  await createTimelineEvents(
    opportunityInsights.slice(0, MAX_GSC_TIMELINE_EVENTS).map((insight) => ({
      userId: input.userId,
      websiteId: input.websiteId,
      type: TimelineEventType.GSC_OPPORTUNITY_FOUND,
      source: TimelineEventSource.GSC,
      severity: TimelineEventSeverity.OPPORTUNITY,
      title: "New Search Console opportunity found",
      summary: insight.title,
      details: {
        code: insight.code,
        description: insight.description,
        recommendation: insight.recommendation,
      },
      dedupeWindowMs: 24 * 60 * 60 * 1000,
    }))
  );
}

export async function timelineAfterArticleDraftCreated(input: {
  userId: string;
  websiteId: string;
  articleId: string;
  title: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.ARTICLE_DRAFT_CREATED,
    source: TimelineEventSource.HERMES,
    severity: TimelineEventSeverity.INFO,
    title: "Article draft created",
    summary: input.title,
    relatedArticleId: input.articleId,
  });
}

export async function timelineAfterQualityCheck(input: {
  userId: string;
  websiteId: string;
  articleId: string;
  title: string;
  qualityScore: number;
  qualityPassed: boolean;
  issuesCount: number;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.AI_RECOMMENDATION_CREATED,
    source: TimelineEventSource.AI_QUALITY_PIPELINE,
    severity: input.qualityPassed
      ? TimelineEventSeverity.SUCCESS
      : TimelineEventSeverity.WARNING,
    title: "AI content quality check completed",
    summary: input.qualityPassed
      ? "The article draft passed quality checks."
      : "The article draft needs your review before publishing.",
    relatedArticleId: input.articleId,
    details: {
      qualityScore: input.qualityScore,
      qualityPassed: input.qualityPassed,
      issuesCount: input.issuesCount,
      articleTitle: input.title,
    },
  });
}

export async function timelineAfterWordPressDraftCreated(input: {
  userId: string;
  websiteId: string;
  articleId: string;
  title: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.WORDPRESS_DRAFT_CREATED,
    source: TimelineEventSource.WORDPRESS,
    severity: TimelineEventSeverity.SUCCESS,
    title: "WordPress draft created",
    summary: "A draft was created in WordPress and is waiting for review.",
    relatedArticleId: input.articleId,
    details: { articleTitle: input.title },
  });
}

export async function timelineAfterIntegrationConnected(input: {
  userId: string;
  websiteId: string;
  integrationKey: string;
  label: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.INTEGRATION_CONNECTED,
    source: TimelineEventSource.SYSTEM,
    severity: TimelineEventSeverity.SUCCESS,
    title: "Integration connected",
    summary: `${input.label} was connected.`,
    relatedIntegration: input.integrationKey,
    dedupeWindowMs: 24 * 60 * 60 * 1000,
  });
}

export async function timelineAfterIntegrationError(input: {
  userId: string;
  websiteId: string;
  integrationKey: string;
  label: string;
  message: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.INTEGRATION_ERROR,
    source: TimelineEventSource.SYSTEM,
    severity: TimelineEventSeverity.ERROR,
    title: "Integration needs attention",
    summary: input.message,
    relatedIntegration: input.integrationKey,
    details: { integration: input.label },
    dedupeWindowMs: 6 * 60 * 60 * 1000,
  });
}

export async function timelineAfterReportCreated(input: {
  userId: string;
  websiteId: string;
  reportId: string;
  title: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.REPORT_CREATED,
    source: TimelineEventSource.REPORTS,
    severity: TimelineEventSeverity.INFO,
    title: "New report created",
    summary: input.title,
    relatedReportId: input.reportId,
  });
}

export async function timelineAfterContentIdeaCreated(input: {
  userId: string;
  websiteId: string;
  title: string;
  articleId?: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.CONTENT_IDEA_CREATED,
    source: TimelineEventSource.CONTENT_PLAN,
    severity: TimelineEventSeverity.OPPORTUNITY,
    title: "New content idea created",
    summary: input.title,
    relatedArticleId: input.articleId ?? null,
  });
}

export async function timelineAfterSocialPostDraftCreated(input: {
  userId: string;
  websiteId: string;
  socialPostId: string;
  title: string;
  platform: string;
  source: string;
  sourceId?: string | null;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.SOCIAL_POST_DRAFT_CREATED,
    source: TimelineEventSource.HERMES,
    severity: TimelineEventSeverity.INFO,
    title: "Social post draft created",
    summary: `A new ${input.platform} post draft was created from ${input.source}.`,
    details: {
      socialPostId: input.socialPostId,
      platform: input.platform,
      source: input.source,
      sourceId: input.sourceId ?? null,
    },
    dedupeWindowMs: 30 * 60 * 1000,
  });
}

export async function timelineAfterSocialPostCopied(input: {
  userId: string;
  websiteId: string;
  socialPostId: string;
  title: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.SYSTEM_NOTE,
    source: TimelineEventSource.SYSTEM,
    severity: TimelineEventSeverity.SUCCESS,
    title: "Social post copied",
    summary: "A social post draft was copied for publishing.",
    details: {
      socialPostId: input.socialPostId,
      title: input.title,
    },
    dedupeWindowMs: 15 * 60 * 1000,
  });
}
