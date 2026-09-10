import assert from "node:assert/strict";

import { getLocaleFromRequest } from "./server-locale";

assert.equal(
  getLocaleFromRequest(
    new Request("https://rankboost.eu/api/dashboard/overview", {
      headers: { "x-rankboost-locale": "ru" },
    })
  ),
  "ru"
);
assert.equal(
  getLocaleFromRequest(
    new Request("https://rankboost.eu/api/dashboard/overview", {
      headers: { "x-rankboost-locale": "invalid" },
    })
  ),
  "en"
);

console.log("server locale request checks passed");
