/** Run with: NODE_OPTIONS='--conditions=react-server' npx tsx lib/auth/responses.test.ts */
import assert from "node:assert/strict";

import { AppError, ErrorCode } from "@/lib/errors";
import {
  authErrorResponse,
  authJsonResponse,
  authNoContentResponse,
} from "./responses";

const request = new Request("https://rankboost.eu/api/auth/login");

for (const response of [
  authJsonResponse({ ok: true }),
  authNoContentResponse(),
  authErrorResponse(request, new AppError(ErrorCode.UNAUTHORIZED, "Denied")),
]) {
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("pragma"), "no-cache");
}

console.log("responses.test.ts: ok");
