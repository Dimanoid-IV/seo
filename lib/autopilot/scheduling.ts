import { assignPipelineScheduleDates } from "./article-pipeline";
import type { AutopilotPlanItem } from "./plan-item-types";

const DEFAULT_TIMEZONE = "UTC";
const SLOT_INTERVAL_DAYS = 2;

/** Start scheduling from the next calendar day in the given timezone (never in the past). */
export function resolveSchedulingStartDate(
  timezone?: string | null,
  now: Date = new Date()
): Date {
  const tz = timezone?.trim() || DEFAULT_TIMEZONE;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);

    const localToday = new Date(Date.UTC(year, month - 1, day, 9, 0, 0));
    const tomorrow = new Date(localToday);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow;
  } catch {
    const fallback = new Date(now);
    fallback.setUTCHours(9, 0, 0, 0);
    fallback.setUTCDate(fallback.getUTCDate() + 1);
    return fallback;
  }
}

function addDaysUtc(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function latestScheduledDate(items: AutopilotPlanItem[]): Date | null {
  let latest: Date | null = null;
  for (const item of items) {
    if (!item.scheduledFor) continue;
    const parsed = new Date(item.scheduledFor);
    if (Number.isNaN(parsed.getTime())) continue;
    if (!latest || parsed > latest) {
      latest = parsed;
    }
  }
  return latest;
}

/**
 * Assign every-other-day slots to newly approved items.
 * Preserves scheduledFor on items already approved/scheduled/prepared.
 */
export function assignEveryOtherDaySlots(input: {
  items: AutopilotPlanItem[];
  approvedItemIds: Set<string>;
  timezone?: string | null;
  now?: Date;
}): AutopilotPlanItem[] {
  const now = input.now ?? new Date();
  const preserved = input.items.filter(
    (item) =>
      !input.approvedItemIds.has(item.id) &&
      item.scheduledFor &&
      ["approved", "scheduled", "prepared", "published", "executed"].includes(
        item.status
      )
  );

  let cursor =
    latestScheduledDate(preserved)?.getTime() != null
      ? addDaysUtc(latestScheduledDate(preserved)!, SLOT_INTERVAL_DAYS)
      : resolveSchedulingStartDate(input.timezone, now);

  if (cursor < now) {
    cursor = resolveSchedulingStartDate(input.timezone, now);
  }

  return input.items.map((item) => {
    if (!input.approvedItemIds.has(item.id)) {
      return item;
    }

    if (
      item.scheduledFor &&
      ["approved", "scheduled", "prepared", "published", "executed"].includes(
        item.status
      )
    ) {
      return item;
    }

    const scheduledFor = cursor.toISOString();
    cursor = addDaysUtc(cursor, SLOT_INTERVAL_DAYS);
    const pipelineDates = assignPipelineScheduleDates(item, scheduledFor);
    const pipelineState =
      item.type === "ARTICLE"
        ? item.researchBrief
          ? ("SCHEDULED_FOR_DRAFT" as const)
          : ("SCHEDULED_FOR_RESEARCH" as const)
        : item.pipelineState;

    return {
      ...item,
      scheduledFor,
      estimatedActionDate: scheduledFor,
      status: item.status === "blocked" ? "blocked" : "scheduled",
      selected: undefined,
      pipelineState,
      ...pipelineDates,
      nextAutomatedStep:
        item.type === "ARTICLE"
          ? item.researchBrief
            ? "generate_draft"
            : "prepare_research"
          : item.nextAutomatedStep,
    };
  });
}
