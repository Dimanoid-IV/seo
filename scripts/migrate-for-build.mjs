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
const prismaCli = "node_modules/prisma/build/index.js";

function runPrisma(args, capture = false) {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    stdio: capture ? "pipe" : "inherit",
    encoding: capture ? "utf8" : undefined,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (capture) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  return result;
}

let result = runPrisma(["migrate", "deploy"], true);
const migrationOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
const recoverableMigration = "20260818003000_autopilot_domain";

if (
  result.status !== 0 &&
  migrationOutput.includes("P3009") &&
  migrationOutput.includes(recoverableMigration)
) {
  console.log(`[build] Completing known partial migration ${recoverableMigration}.`);
  const repair = runPrisma([
    "db",
    "execute",
    "--file",
    "scripts/recover-autopilot-domain-migration.sql",
  ]);
  if (repair.status !== 0) process.exit(repair.status ?? 1);

  const resolve = runPrisma([
    "migrate",
    "resolve",
    "--applied",
    recoverableMigration,
  ]);
  if (resolve.status !== 0) process.exit(resolve.status ?? 1);

  result = runPrisma(["migrate", "deploy"]);
}

process.exit(result.status ?? 1);
