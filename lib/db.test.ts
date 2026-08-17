/** Run with: npx tsx lib/db.test.ts */
import assert from "node:assert/strict";

import { normalizeDatabaseConnectionString } from "./db";

const strict = normalizeDatabaseConnectionString(
  "postgresql://user:pass@example.com/db?sslmode=require&channel_binding=require"
);
assert.equal(new URL(strict).searchParams.get("sslmode"), "verify-full");
assert.equal(new URL(strict).searchParams.get("channel_binding"), "require");

const unchanged = normalizeDatabaseConnectionString(
  "postgresql://user:pass@example.com/db?sslmode=disable"
);
assert.equal(new URL(unchanged).searchParams.get("sslmode"), "disable");

console.log("db.test.ts: ok");
