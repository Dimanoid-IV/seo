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
