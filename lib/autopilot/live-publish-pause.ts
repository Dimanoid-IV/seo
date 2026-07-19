/**
 * Per-website emergency pause for live publish (Prompt 11.53).
 * Does not stop research/draft/review/package flows.
 */
import "server-only";

import {
  ActivityType,
  TimelineEventSource,
  TimelineEventType,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { resolveWebsiteForAutopilot } from "@/lib/autopilot/resolve-website";

export type LivePublishPauseState = {
  websiteId: string;
  paused: boolean;
  pausedAt: string | null;
  pausedByUserId: string | null;
  pauseReason: string | null;
};

export async function getLivePublishPauseState(
  websiteId: string
): Promise<LivePublishPauseState> {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: { id: websiteId, deletedAt: null },
    select: {
      id: true,
      autopilotLivePublishPaused: true,
      autopilotLivePublishPausedAt: true,
      autopilotLivePublishPausedByUserId: true,
      autopilotLivePublishPauseReason: true,
    },
  });
  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Website not found");
  }
  return {
    websiteId: website.id,
    paused: website.autopilotLivePublishPaused,
    pausedAt: website.autopilotLivePublishPausedAt?.toISOString() ?? null,
    pausedByUserId: website.autopilotLivePublishPausedByUserId,
    pauseReason: website.autopilotLivePublishPauseReason,
  };
}

export async function pauseWebsiteLivePublish(input: {
  userId: string;
  organizationId: string | null;
  websiteId?: string | null;
  reason?: string | null;
}): Promise<LivePublishPauseState> {
  const { organization, website } = await resolveWebsiteForAutopilot(
    input.userId,
    input.organizationId,
    input.websiteId
  );
  const prisma = getPrisma();
  const now = new Date();
  const reason = input.reason?.trim().slice(0, 500) || null;

  const updated = await prisma.website.update({
    where: { id: website.id },
    data: {
      autopilotLivePublishPaused: true,
      autopilotLivePublishPausedAt: now,
      autopilotLivePublishPausedByUserId: input.userId,
      autopilotLivePublishPauseReason: reason,
    },
    select: {
      id: true,
      autopilotLivePublishPaused: true,
      autopilotLivePublishPausedAt: true,
      autopilotLivePublishPausedByUserId: true,
      autopilotLivePublishPauseReason: true,
    },
  });

  await prisma.activity.create({
    data: {
      organizationId: organization.id,
      websiteId: website.id,
      userId: input.userId,
      type: ActivityType.SYSTEM_NOTICE,
      title: "Live publish paused",
      description:
        "Autopilot live publishing is paused for this website. Drafts and review still work.",
      metadataJson: {
        action: "live_publish_pause",
        reason,
      },
    },
  });

  await prisma.timelineEvent.create({
    data: {
      userId: input.userId,
      websiteId: website.id,
      type: TimelineEventType.SYSTEM_NOTE,
      source: TimelineEventSource.SYSTEM,
      title: "Live publish paused",
      summary:
        reason ??
        "Emergency pause: no new live WordPress publish for this website.",
      details: {
        action: "live_publish_pause",
        reason,
      },
    },
  });

  return {
    websiteId: updated.id,
    paused: updated.autopilotLivePublishPaused,
    pausedAt: updated.autopilotLivePublishPausedAt?.toISOString() ?? null,
    pausedByUserId: updated.autopilotLivePublishPausedByUserId,
    pauseReason: updated.autopilotLivePublishPauseReason,
  };
}

export async function resumeWebsiteLivePublish(input: {
  userId: string;
  organizationId: string | null;
  websiteId?: string | null;
}): Promise<LivePublishPauseState> {
  const { organization, website } = await resolveWebsiteForAutopilot(
    input.userId,
    input.organizationId,
    input.websiteId
  );
  const prisma = getPrisma();

  const updated = await prisma.website.update({
    where: { id: website.id },
    data: {
      autopilotLivePublishPaused: false,
      autopilotLivePublishPausedAt: null,
      autopilotLivePublishPausedByUserId: null,
      autopilotLivePublishPauseReason: null,
    },
    select: {
      id: true,
      autopilotLivePublishPaused: true,
      autopilotLivePublishPausedAt: true,
      autopilotLivePublishPausedByUserId: true,
      autopilotLivePublishPauseReason: true,
    },
  });

  await prisma.activity.create({
    data: {
      organizationId: organization.id,
      websiteId: website.id,
      userId: input.userId,
      type: ActivityType.SYSTEM_NOTICE,
      title: "Live publish resumed",
      description:
        "Autopilot live publishing may run again when plans and gates allow.",
      metadataJson: {
        action: "live_publish_resume",
      },
    },
  });

  await prisma.timelineEvent.create({
    data: {
      userId: input.userId,
      websiteId: website.id,
      type: TimelineEventType.SYSTEM_NOTE,
      source: TimelineEventSource.SYSTEM,
      title: "Live publish resumed",
      summary: "Emergency pause cleared for this website.",
      details: {
        action: "live_publish_resume",
      },
    },
  });

  return {
    websiteId: updated.id,
    paused: updated.autopilotLivePublishPaused,
    pausedAt: null,
    pausedByUserId: null,
    pauseReason: null,
  };
}
