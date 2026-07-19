import {
  TimelineEventSeverity,
  TimelineEventSource,
  TimelineEventType,
} from "@prisma/client";

import { createTimelineEvent } from "@/lib/timeline/create-event";

export async function timelineAfterMonthlyAutopilotPlanCreated(input: {
  userId: string;
  websiteId: string;
  planId: string;
  month: string;
  focusAreasCount: number;
  recommendedActionsCount: number;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.MONTHLY_AUTOPILOT_PLAN_CREATED,
    source: TimelineEventSource.CONTINUOUS_IMPROVEMENT,
    severity: TimelineEventSeverity.INFO,
    title: "Monthly growth plan created",
    summary:
      "RankBoost prepared a monthly plan with priority tasks, content ideas, and social post opportunities.",
    details: {
      month: input.month,
      planId: input.planId,
      focusAreasCount: input.focusAreasCount,
      recommendedActionsCount: input.recommendedActionsCount,
    },
  });
}

export async function timelineAfterMonthlyAutopilotPlanApproved(input: {
  userId: string;
  websiteId: string;
  planId: string;
  month: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.SYSTEM_NOTE,
    source: TimelineEventSource.SYSTEM,
    severity: TimelineEventSeverity.SUCCESS,
    title: "Monthly growth plan approved",
    summary: "The monthly plan was approved and is ready for execution.",
    details: {
      month: input.month,
      planId: input.planId,
    },
  });
}

export async function timelineAfterAutopilotPlanItemExecuted(input: {
  userId: string;
  websiteId: string;
  planId: string;
  planItemId: string;
  action:
    | "PREPARE_RESEARCH_BRIEF"
    | "PREPARE_ARTICLE_DRAFT"
    | "PREPARE_PUBLISHING_HANDOFF"
    | "PUBLISH_APPROVED_ARTICLE"
    | "LIVE_PUBLISH_ARTICLE";
  itemTitle: string;
}) {
  const summaryByAction: Record<typeof input.action, string> = {
    PREPARE_RESEARCH_BRIEF:
      "Autopilot prepared a research brief for a scheduled article.",
    PREPARE_ARTICLE_DRAFT: "Autopilot prepared an article draft for review.",
    PREPARE_PUBLISHING_HANDOFF:
      "Autopilot prepared a publishing handoff (draft or export package).",
    PUBLISH_APPROVED_ARTICLE:
      "Autopilot created a WordPress draft from an approved article.",
    LIVE_PUBLISH_ARTICLE:
      "Autopilot attempted WordPress live publish for an approved plan article.",
  };

  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.SYSTEM_NOTE,
    source: TimelineEventSource.CONTINUOUS_IMPROVEMENT,
    severity: TimelineEventSeverity.INFO,
    title: "Autopilot plan item executed",
    summary: summaryByAction[input.action],
    details: {
      planId: input.planId,
      planItemId: input.planItemId,
      action: input.action,
      itemTitle: input.itemTitle,
    },
  });
}
