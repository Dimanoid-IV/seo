import assert from "node:assert/strict";

import {
  NO_CODE_AUTOMATION_KIND,
  parseNoCodeAutomationProvider,
  toDbProvider,
} from "./no-code-automation-config";
import { IntegrationProvider } from "@prisma/client";

assert.equal(parseNoCodeAutomationProvider("zapier"), "zapier");
assert.equal(parseNoCodeAutomationProvider("make"), "make");
assert.equal(parseNoCodeAutomationProvider("webhook"), null);
assert.equal(toDbProvider("zapier"), IntegrationProvider.ZAPIER);
assert.equal(toDbProvider("make"), IntegrationProvider.MAKE);
assert.equal(NO_CODE_AUTOMATION_KIND, "rankboost_no_code_automation");

console.log("no-code-automation.test.ts: ok");
