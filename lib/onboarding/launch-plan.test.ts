import assert from "node:assert/strict";
import { launchPreparedPlan } from "./launch-plan";

async function main() {
  const calls: string[] = [];
  const dependencies = {
    approve: async (id: string) => { calls.push(`approve:${id}`); return true; },
    complete: async () => { calls.push("complete"); },
  };
  assert.equal(await launchPreparedPlan({ hasAudit: false, planId: "plan", planApproved: false }, dependencies), false);
  assert.deepEqual(calls, [], "a plan alone must not fake successful setup");
  assert.equal(await launchPreparedPlan({ hasAudit: true, planId: "plan", planApproved: false }, dependencies), true);
  assert.deepEqual(calls, ["approve:plan", "complete"], "launch must schedule work before marking setup complete");
  calls.length = 0;
  await launchPreparedPlan({ hasAudit: true, planId: "plan", planApproved: true }, dependencies);
  assert.deepEqual(calls, ["complete"], "preserve already approved publishing preferences");
  calls.length = 0;
  assert.equal(await launchPreparedPlan({ hasAudit: true, planId: "plan", planApproved: false }, { ...dependencies, approve: async () => false }), false);
  assert.deepEqual(calls, [], "an empty/blocked plan must not claim the service is running");
  await assert.rejects(() => launchPreparedPlan({ hasAudit: true, planId: "plan", planApproved: false }, { ...dependencies, approve: async () => { throw new Error("storage unavailable"); } }));
  assert.deepEqual(calls, []);
  console.log("launch plan tests passed");
}
void main();
