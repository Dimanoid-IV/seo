import assert from "node:assert/strict";
import { resetEnvCacheForTests } from "@/lib/env";
import { researchLiveSerp } from "./serp-research";

async function main() {
  delete process.env.SERPER_API_KEY;
  resetEnvCacheForTests();
  const result = await researchLiveSerp({ query: "custom portrait", locale: "en" });
  assert.equal(result.available, false);
  assert.match(result.unavailableReason ?? "", /SERPER_API_KEY/);
  assert.deepEqual(result.topPages, []);
  console.log("SERP research unavailable-state checks passed");
}

void main();
