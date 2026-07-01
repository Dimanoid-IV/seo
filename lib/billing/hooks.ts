import { createTimelineEvent } from "@/lib/timeline/create-event";
import {
  TimelineEventSeverity,
  TimelineEventSource,
  TimelineEventType,
} from "@prisma/client";

export async function timelineAfterSubscriptionUpdated(input: {
  userId: string;
  websiteId: string | null;
  organizationId: string;
  plan: string;
}) {
  const prisma = (await import("@/lib/db")).getPrisma();

  const website = input.websiteId
    ? { id: input.websiteId }
    : await prisma.website.findFirst({
        where: { organizationId: input.organizationId, deletedAt: null },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });

  if (!website) {
    return;
  }

  await createTimelineEvent({
    userId: input.userId,
    websiteId: website.id,
    type: TimelineEventType.SYSTEM_NOTE,
    source: TimelineEventSource.SYSTEM,
    severity: TimelineEventSeverity.INFO,
    title: "Subscription updated",
    summary: "Your RankBoost subscription was updated.",
    details: {
      plan: input.plan,
      organizationId: input.organizationId,
    },
  });
}
