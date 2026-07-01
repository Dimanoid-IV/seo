import "server-only";

import { createTimelineEvent } from "@/lib/timeline/create-event";
import {
  TimelineEventSeverity,
  TimelineEventSource,
  TimelineEventType,
} from "@prisma/client";

export async function timelineAfterOnboardingCompleted(input: {
  userId: string;
  websiteId: string | null;
}) {
  if (!input.websiteId) {
    return;
  }

  await createTimelineEvent({
    userId: input.userId,
    websiteId: input.websiteId,
    type: TimelineEventType.SYSTEM_NOTE,
    source: TimelineEventSource.SYSTEM,
    severity: TimelineEventSeverity.SUCCESS,
    title: "Onboarding completed",
    summary: "The first RankBoost setup flow was completed.",
    details: {
      source: "onboarding_v2",
    },
    dedupeWindowMs: 24 * 60 * 60 * 1000,
  });
}
