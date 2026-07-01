import "server-only";

import type { Prisma, TimelineEvent } from "@prisma/client";

import { getPrisma } from "@/lib/db";

import type { CreateTimelineEventInput } from "./types";

const DEFAULT_DEDUPE_WINDOW_MS = 60 * 60 * 1000;

function logTimelineError(error: unknown, input: CreateTimelineEventInput) {
  console.error("[timeline] Failed to create event", {
    type: input.type,
    websiteId: input.websiteId,
    error,
  });
}

function buildDedupeWhere(
  input: CreateTimelineEventInput,
  since: Date
): Prisma.TimelineEventWhereInput {
  const where: Prisma.TimelineEventWhereInput = {
    userId: input.userId,
    websiteId: input.websiteId,
    type: input.type,
    createdAt: { gte: since },
  };

  if (input.relatedTaskId) {
    where.relatedTaskId = input.relatedTaskId;
  }
  if (input.relatedArticleId) {
    where.relatedArticleId = input.relatedArticleId;
  }
  if (input.relatedReportId) {
    where.relatedReportId = input.relatedReportId;
  }
  if (input.relatedIntegration) {
    where.relatedIntegration = input.relatedIntegration;
  }

  return where;
}

/**
 * Server-only helper to append a timeline event without blocking business logic.
 */
export async function createTimelineEvent(
  input: CreateTimelineEventInput
): Promise<TimelineEvent | null> {
  if (!input.userId?.trim() || !input.websiteId?.trim() || !input.title?.trim()) {
    return null;
  }

  const prisma = getPrisma();
  const dedupeWindowMs = input.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;

  try {
    if (dedupeWindowMs > 0) {
      const duplicate = await prisma.timelineEvent.findFirst({
        where: buildDedupeWhere(
          input,
          new Date(Date.now() - dedupeWindowMs)
        ),
        select: { id: true },
      });

      if (duplicate) {
        return null;
      }
    }

    return await prisma.timelineEvent.create({
      data: {
        userId: input.userId,
        websiteId: input.websiteId,
        type: input.type,
        source: input.source,
        title: input.title,
        summary: input.summary ?? null,
        details: input.details ? (input.details as Prisma.InputJsonValue) : undefined,
        severity: input.severity ?? "INFO",
        relatedTaskId: input.relatedTaskId ?? null,
        relatedArticleId: input.relatedArticleId ?? null,
        relatedReportId: input.relatedReportId ?? null,
        relatedIntegration: input.relatedIntegration ?? null,
      },
    });
  } catch (error) {
    logTimelineError(error, input);
    return null;
  }
}

export async function createTimelineEvents(
  events: CreateTimelineEventInput[]
): Promise<number> {
  let created = 0;

  for (const event of events) {
    const record = await createTimelineEvent(event);
    if (record) {
      created += 1;
    }
  }

  return created;
}
