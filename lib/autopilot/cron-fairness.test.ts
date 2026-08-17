import assert from "node:assert/strict";

import { selectFairCronPlans } from "./cron-fairness";

const plans = Array.from({ length: 60 }, (_, index) => ({
  id: `plan-${index}`,
  userId: `user-${index}`,
  websiteId: `website-${String(index).padStart(2, "0")}`,
  organizationId: `org-${index}`,
  month: "2026-08",
}));
plans.push({ ...plans[0], id: "older-plan", month: "2026-07" });

const seen = new Set<string>();
for (let day = 0; day < 3; day += 1) {
  const selected = selectFairCronPlans({
    plans,
    limit: 25,
    now: new Date(Date.UTC(2026, 7, 17 + day)),
  });
  assert.equal(selected.length, 25);
  assert.equal(new Set(selected.map((plan) => plan.websiteId)).size, 25);
  assert.equal(selected.some((plan) => plan.id === "older-plan"), false);
  selected.forEach((plan) => seen.add(plan.websiteId));
}
assert.equal(seen.size, 60, "every website must receive a cron turn within the rotation");

console.log("autopilot cron fairness checks passed");
