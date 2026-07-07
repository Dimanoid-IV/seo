import { getServerStrings } from "@/lib/i18n/saas/server-strings";
import type { SaasLocale } from "@/lib/i18n/saas/locales";

import type { TimelineEventViewModel, TimelineSummary } from "./types";

function formatScoreDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }
  return `${delta}`;
}

export function buildTimelineSummary(
  events: TimelineEventViewModel[],
  since: Date | null,
  totalEvents: number,
  scoreDeltaFromDetails?: number,
  locale: SaasLocale = "en"
): TimelineSummary {
  const headlines = getServerStrings(locale).timeline.summaryHeadlines;
  const newTasksCount = events.filter((event) => event.type === "TASK_CREATED")
    .length;
  const completedTasksCount = events.filter(
    (event) => event.type === "TASK_COMPLETED"
  ).length;
  const opportunitiesCount = events.filter((event) =>
    ["GSC_OPPORTUNITY_FOUND", "GSC_INSIGHT_FOUND", "TASK_CREATED"].includes(
      event.type
    )
  ).length;
  const warningsCount = events.filter((event) => event.severity === "WARNING")
    .length;

  let scoreDelta: number | undefined = scoreDeltaFromDetails;

  if (scoreDelta == null) {
    for (const event of events) {
      if (event.type !== "SCORE_CHANGED") {
        continue;
      }

      const match = event.summary?.match(/\(([+-]?\d+)\)/);
      if (match) {
        scoreDelta = Number.parseInt(match[1] ?? "0", 10);
        break;
      }
    }
  }

  const importantEvents = events
    .filter((event) =>
      ["OPPORTUNITY", "SUCCESS", "WARNING", "ERROR"].includes(event.severity)
    )
    .slice(0, 5);

  let headline: string;

  if (!since || totalEvents === 0) {
    headline = headlines.quiet;
  } else if (totalEvents === 0) {
    headline = headlines.quiet;
  } else {
    const parts: string[] = [];

    if (opportunitiesCount > 0) {
      parts.push(headlines.opportunities(opportunitiesCount));
    }
    if (newTasksCount > 0) {
      parts.push(headlines.newTasks(newTasksCount));
    }
    if (completedTasksCount > 0) {
      parts.push(headlines.completedTasks(completedTasksCount));
    }
    if (scoreDelta != null && scoreDelta !== 0) {
      parts.push(headlines.scoreChange(formatScoreDelta(scoreDelta)));
    }

    headline =
      parts.length > 0
        ? headlines.sinceVisit(parts.join(", "))
        : headlines.monitoringContinued;
  }

  return {
    totalEvents,
    importantEvents,
    newTasksCount,
    completedTasksCount,
    opportunitiesCount,
    warningsCount,
    scoreDelta,
    headline,
  };
}

export async function getTimelineSummary(input: {
  userId: string;
  websiteId: string;
  since: Date | null;
  locale?: SaasLocale;
}): Promise<TimelineSummary> {
  const { getPrisma } = await import("@/lib/db");
  const { formatTimelineEvent } = await import("./format");
  const locale = input.locale ?? "en";

  const prisma = getPrisma();
  const since = input.since ?? new Date(0);

  const eventsRaw = await prisma.timelineEvent.findMany({
    where: {
      userId: input.userId,
      websiteId: input.websiteId,
      createdAt: { gt: since },
    },
    orderBy: { createdAt: "desc" },
  });

  const events = eventsRaw.map((event) => formatTimelineEvent(event, locale));

  return buildTimelineSummary(events, input.since, events.length, undefined, locale);
}
