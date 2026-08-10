import type { AutopilotPlanItem } from "./plan-item-types";

export type PublicationCalendarDay = {
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
};

export type PublicationCalendarEntry = {
  item: AutopilotPlanItem;
  dateKey: string;
  publishAt: string;
  planId?: string;
  planMonth?: string;
  planStatus?: string;
};

export type PublicationCalendarData = {
  month: string;
  websiteId: string;
  websiteUrl: string;
  entries: PublicationCalendarEntry[];
  approvedPlanCount: number;
};

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildPublicationCalendarDays(
  monthKey: string
): PublicationCalendarDay[] {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return [];

  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(gridStart.getUTCDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    return {
      dateKey: toDateKey(date),
      dayNumber: date.getUTCDate(),
      inCurrentMonth: date.getUTCMonth() === month - 1,
    };
  });
}

export function getPublicationCalendarEntries(
  items: AutopilotPlanItem[] | undefined,
  monthKey: string
): PublicationCalendarEntry[] {
  return (items ?? [])
    .filter((item) => item.type === "ARTICLE")
    .flatMap((item) => {
      const publishAt =
        item.plannedPublishAt ?? item.scheduledFor ?? item.estimatedActionDate;
      if (!publishAt) return [];

      const parsed = new Date(publishAt);
      if (Number.isNaN(parsed.getTime())) return [];

      const dateKey = toDateKey(parsed);
      if (!dateKey.startsWith(`${monthKey}-`)) return [];

      return [{ item, dateKey, publishAt }];
    })
    .sort((left, right) => left.publishAt.localeCompare(right.publishAt));
}

export function collectPublicationCalendarEntries(
  plans: Array<{
    id: string;
    month: string;
    status: string;
    items: AutopilotPlanItem[];
  }>,
  monthKey: string
): PublicationCalendarEntry[] {
  const seen = new Set<string>();
  const entries: PublicationCalendarEntry[] = [];

  for (const plan of plans) {
    for (const entry of getPublicationCalendarEntries(plan.items, monthKey)) {
      const identity = entry.item.generatedArticleId ?? entry.item.id;
      if (seen.has(identity)) continue;
      seen.add(identity);
      entries.push({
        ...entry,
        planId: plan.id,
        planMonth: plan.month,
        planStatus: plan.status.toLowerCase(),
      });
    }
  }

  return entries.sort((left, right) => left.publishAt.localeCompare(right.publishAt));
}
