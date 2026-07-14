import assert from "node:assert/strict";

import { assignEveryOtherDaySlots } from "./scheduling";
import type { AutopilotPlanItem } from "./plan-item-types";

function item(id: string, overrides: Partial<AutopilotPlanItem> = {}): AutopilotPlanItem {
  return {
    id,
    type: "TASK_FIX",
    title: id,
    reason: "Reason",
    riskLevel: "low",
    needsIntegration: false,
    integrationType: "manual",
    status: "proposed",
    ...overrides,
  };
}

const approvedIds = new Set(["a", "b"]);
const scheduled = assignEveryOtherDaySlots({
  items: [item("a"), item("b"), item("c", { status: "proposed" })],
  approvedItemIds: approvedIds,
  now: new Date("2026-07-15T12:00:00.000Z"),
});

assert.equal(scheduled.filter((entry) => entry.scheduledFor).length, 2);
assert.equal(scheduled.find((entry) => entry.id === "c")?.scheduledFor, undefined);
assert.notEqual(scheduled[0]?.scheduledFor, scheduled[1]?.scheduledFor);

console.log("autopilot scheduling checks passed");
