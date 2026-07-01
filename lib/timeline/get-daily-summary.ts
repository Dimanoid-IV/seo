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
  scoreDeltaFromDetails?: number
): TimelineSummary {
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
    headline =
      "No major changes since your last visit. RankBoost is still monitoring your website.";
  } else if (totalEvents === 0) {
    headline =
      "No major changes since your last visit. RankBoost is still monitoring your website.";
  } else {
    const parts: string[] = [];

    if (opportunitiesCount > 0) {
      parts.push(
        `${opportunitiesCount} new ${opportunitiesCount === 1 ? "opportunity" : "opportunities"}`
      );
    }
    if (newTasksCount > 0) {
      parts.push(
        `${newTasksCount} new ${newTasksCount === 1 ? "task" : "tasks"}`
      );
    }
    if (completedTasksCount > 0) {
      parts.push(
        `${completedTasksCount} completed ${completedTasksCount === 1 ? "task" : "tasks"}`
      );
    }
    if (scoreDelta != null && scoreDelta !== 0) {
      parts.push(`Growth Score ${formatScoreDelta(scoreDelta)}`);
    }

    headline =
      parts.length > 0
        ? `Since your last visit, RankBoost found ${parts.join(", ")}.`
        : "RankBoost continued monitoring your website while you were away.";
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
}): Promise<TimelineSummary> {
  const { getPrisma } = await import("@/lib/db");
  const { formatTimelineEvent } = await import("./format");

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

  const events = eventsRaw.map(formatTimelineEvent);

  return buildTimelineSummary(events, input.since, events.length);
}
