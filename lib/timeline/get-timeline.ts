import {
  TimelineEventSeverity,
  TimelineEventSource,
  TimelineEventType,
  WebsiteStatus,
} from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { formatTimelineEvent } from "./format";
import { buildTimelineSummary } from "./get-daily-summary";
import type { TimelineListResult, TimelineQuery } from "./types";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

type ResolvedWebsite = {
  id: string;
  organizationId: string;
};

export async function resolveActiveWebsiteForUser(
  currentUser: CurrentUser
): Promise<ResolvedWebsite | null> {
  const prisma = getPrisma();

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  if (!organization) {
    return null;
  }

  const website = await prisma.website.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, organizationId: true },
  });

  if (!website) {
    return null;
  }

  return website;
}

async function assertWebsiteAccess(
  currentUser: CurrentUser,
  websiteId: string
): Promise<ResolvedWebsite> {
  const prisma = getPrisma();

  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
      organization: {
        deletedAt: null,
        ownerUserId: currentUser.id,
      },
    },
    select: { id: true, organizationId: true },
  });

  if (!website) {
    throw new AppError(ErrorCode.FORBIDDEN, "Нет доступа к этому сайту");
  }

  return website;
}

function decodeCursor(cursor: string | null | undefined): Date | null {
  if (!cursor?.trim()) {
    return null;
  }

  const parsed = new Date(cursor);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getTimelineLastSeenAt(
  userId: string,
  websiteId: string
): Promise<Date | null> {
  const prisma = getPrisma();

  const state = await prisma.websiteUserState.findUnique({
    where: {
      userId_websiteId: {
        userId,
        websiteId,
      },
    },
    select: { timelineLastSeenAt: true },
  });

  return state?.timelineLastSeenAt ?? null;
}

export async function getTimelineForUser(
  currentUser: CurrentUser,
  query: TimelineQuery = {}
): Promise<TimelineListResult> {
  const website = await resolveActiveWebsiteForUser(currentUser);

  if (!website) {
    return {
      events: [],
      unreadCount: 0,
      summary: buildTimelineSummary([], null, 0),
      websiteId: null,
      nextCursor: null,
    };
  }

  return getTimelineForWebsite(currentUser.id, website.id, query);
}

export async function getTimelineForWebsite(
  userId: string,
  websiteId: string,
  query: TimelineQuery = {}
): Promise<TimelineListResult> {
  const prisma = getPrisma();
  const locale = query.locale ?? "en";
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const cursorDate = decodeCursor(query.cursor);

  const where = {
    userId,
    websiteId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.source ? { source: query.source } : {}),
    ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
  };

  const [eventsRaw, unreadCount, lastSeenAt] = await Promise.all([
    prisma.timelineEvent.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    }),
    prisma.timelineEvent.count({
      where: {
        userId,
        websiteId,
        isRead: false,
      },
    }),
    getTimelineLastSeenAt(userId, websiteId),
  ]);

  const hasMore = eventsRaw.length > limit;
  const page = hasMore ? eventsRaw.slice(0, limit) : eventsRaw;
  const events = page.map((event) => formatTimelineEvent(event, locale));
  const nextCursor = hasMore
    ? page[page.length - 1]?.createdAt.toISOString() ?? null
    : null;

  const since = lastSeenAt ?? new Date(0);
  const sinceEventsRaw = await prisma.timelineEvent.findMany({
    where: {
      userId,
      websiteId,
      createdAt: { gt: since },
    },
    orderBy: { createdAt: "desc" },
  });

  const scoreChangedEvent = sinceEventsRaw.find(
    (event) => event.type === "SCORE_CHANGED"
  );
  const scoreDeltaFromDetails =
    scoreChangedEvent?.details &&
    typeof scoreChangedEvent.details === "object" &&
    scoreChangedEvent.details !== null &&
    "delta" in scoreChangedEvent.details
      ? Number(
          (scoreChangedEvent.details as { delta?: number | null }).delta ?? 0
        )
      : undefined;

  const summary = buildTimelineSummary(
    sinceEventsRaw.map((event) => formatTimelineEvent(event, locale)),
    lastSeenAt,
    sinceEventsRaw.length,
    scoreDeltaFromDetails
  );

  return {
    events,
    unreadCount,
    summary,
    websiteId,
    nextCursor,
  };
}

export async function markTimelineEventsRead(input: {
  currentUser: CurrentUser;
  websiteId?: string | null;
  eventIds?: string[];
}): Promise<{ updatedCount: number; timelineLastSeenAt: string }> {
  const prisma = getPrisma();
  const website = input.websiteId
    ? await assertWebsiteAccess(input.currentUser, input.websiteId)
    : await resolveActiveWebsiteForUser(input.currentUser);

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Активный сайт не найден");
  }

  const now = new Date();

  const updateResult = await prisma.timelineEvent.updateMany({
    where: {
      userId: input.currentUser.id,
      websiteId: website.id,
      isRead: false,
      ...(input.eventIds?.length ? { id: { in: input.eventIds } } : {}),
    },
    data: { isRead: true },
  });

  await prisma.websiteUserState.upsert({
    where: {
      userId_websiteId: {
        userId: input.currentUser.id,
        websiteId: website.id,
      },
    },
    create: {
      userId: input.currentUser.id,
      websiteId: website.id,
      timelineLastSeenAt: now,
    },
    update: {
      timelineLastSeenAt: now,
    },
  });

  return {
    updatedCount: updateResult.count,
    timelineLastSeenAt: now.toISOString(),
  };
}

export {
  TimelineEventSeverity,
  TimelineEventSource,
  TimelineEventType,
};
