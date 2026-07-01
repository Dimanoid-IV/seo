import {
  TimelineEventSeverity,
  TimelineEventSource,
  TimelineEventType,
} from "@prisma/client";

import { createTimelineEvent } from "@/lib/timeline/create-event";

export async function timelineAfterEmailApprovalCreated(input: {
  userId: string;
  websiteId: string;
  emailApprovalId: string;
  type: string;
  source: string;
  sourceId?: string | null;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.EMAIL_APPROVAL_CREATED,
    source: TimelineEventSource.SYSTEM,
    severity: TimelineEventSeverity.INFO,
    title: "Review email prepared",
    summary: "RankBoost prepared an email draft for your approval.",
    details: {
      emailApprovalId: input.emailApprovalId,
      type: input.type,
      source: input.source,
      sourceId: input.sourceId ?? null,
    },
  });
}

export async function timelineAfterEmailApprovalApproved(input: {
  userId: string;
  websiteId: string;
  emailApprovalId: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.SYSTEM_NOTE,
    source: TimelineEventSource.SYSTEM,
    severity: TimelineEventSeverity.SUCCESS,
    title: "Review email approved",
    summary: "An email draft was approved by the user.",
    details: { emailApprovalId: input.emailApprovalId },
  });
}

export async function timelineAfterEmailApprovalSent(input: {
  userId: string;
  websiteId: string;
  emailApprovalId: string;
  recipientEmail: string;
}) {
  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.SYSTEM_NOTE,
    source: TimelineEventSource.SYSTEM,
    severity: TimelineEventSeverity.SUCCESS,
    title: "Review email sent",
    summary: "An approved review email was sent manually.",
    details: {
      emailApprovalId: input.emailApprovalId,
      recipientEmail: input.recipientEmail,
    },
  });
}
