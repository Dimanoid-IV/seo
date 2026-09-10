import assert from "node:assert/strict";
import { migrationConnectionString } from "../scripts/migration-connection.mjs";

const pooled = "postgresql://test:secret@ep-example-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require";
assert.equal(new URL(migrationConnectionString(pooled)).hostname, "ep-example.us-west-2.aws.neon.tech");
assert.equal(new URL(migrationConnectionString(pooled)).password, "secret");
assert.equal(new URL(migrationConnectionString(pooled)).searchParams.get("sslmode"), "require");
assert.equal(migrationConnectionString("postgresql://test:secret@custom-pooler.example.com/db"), "postgresql://test:secret@custom-pooler.example.com/db");
assert.equal(migrationConnectionString(pooled, "postgresql://test:direct@db.example.com/db"), "postgresql://test:direct@db.example.com/db");
console.log("migration connection tests passed");
