import { spawnSync } from "node:child_process";

const connectionString = process.env.DATABASE_URL?.trim();
let validDatabaseUrl = false;
try {
  const parsed = connectionString ? new URL(connectionString) : null;
  validDatabaseUrl = parsed?.protocol === "postgres:" || parsed?.protocol === "postgresql:";
} catch {
  validDatabaseUrl = false;
}

if (!validDatabaseUrl) {
  console.log("[build] DATABASE_URL is unavailable; skipping migrate deploy.");
  process.exit(0);
}

console.log("[build] Applying pending Prisma migrations.");
const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
