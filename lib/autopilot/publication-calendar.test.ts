import assert from "node:assert/strict";

import {
  buildPublicationCalendarDays,
  collectPublicationCalendarEntries,
  getPublicationCalendarEntries,
} from "./publication-calendar";
import type { AutopilotPlanItem } from "./plan-item-types";

const days = buildPublicationCalendarDays("2026-08");
assert.equal(days.length, 42);
assert.equal(days[0]?.dateKey, "2026-07-27");
assert.equal(days[41]?.dateKey, "2026-09-06");
assert.equal(days.filter((day) => day.inCurrentMonth).length, 31);

const item = (overrides: Partial<AutopilotPlanItem>): AutopilotPlanItem => ({
  id: "item-1",
  type: "ARTICLE",
  title: "Article",
  reason: "Reason",
  riskLevel: "low",
  needsIntegration: false,
  integrationType: "none",
  status: "scheduled",
  ...overrides,
});

const entries = getPublicationCalendarEntries(
  [
    item({ plannedPublishAt: "2026-08-11T06:00:00.000Z" }),
    item({ id: "item-2", type: "TASK_FIX", plannedPublishAt: "2026-08-13T06:00:00.000Z" }),
    item({ id: "item-3", plannedPublishAt: "2026-09-01T06:00:00.000Z" }),
    item({ id: "item-4", plannedPublishAt: undefined, scheduledFor: "2026-08-09T06:00:00.000Z" }),
  ],
  "2026-08"
);

assert.deepEqual(
  entries.map((entry) => [entry.item.id, entry.dateKey]),
  [
    ["item-4", "2026-08-09"],
    ["item-1", "2026-08-11"],
  ]
);

const crossMonthEntries = collectPublicationCalendarEntries(
  [
    {
      id: "july-plan",
      month: "2026-07",
      status: "APPROVED",
      items: [item({ plannedPublishAt: "2026-08-11T06:00:00.000Z" })],
    },
    {
      id: "older-plan",
      month: "2026-06",
      status: "APPROVED",
      items: [item({ plannedPublishAt: "2026-08-11T06:00:00.000Z" })],
    },
  ],
  "2026-08"
);

assert.equal(crossMonthEntries.length, 1);
assert.equal(crossMonthEntries[0]?.planId, "july-plan");
assert.equal(crossMonthEntries[0]?.planStatus, "approved");

console.log("publication-calendar tests passed");
