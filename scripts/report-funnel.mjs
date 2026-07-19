/**
 * Funnel aggregate report (Prompt 11.47).
 * Prints last-7-days counts only — no event payloads, no secrets, no content.
 *
 * Usage:
 *   set -a && source data/.env.production.local && set +a && node --import tsx scripts/report-funnel.mjs
 *   # or with DATABASE_URL already set:
 *   node --import tsx scripts/report-funnel.mjs
 */

import { pathToFileURL } from "node:url";
import path from "node:path";

const load = (rel) =>
  import(pathToFileURL(path.join(process.cwd(), rel)).href);

const days = Math.min(
  Math.max(Number.parseInt(process.argv[2] || "7", 10) || 7, 1),
  90
);

const { getPrisma } = await load("lib/db.ts");
const { FUNNEL_STEPS, PRODUCT_EVENTS } = await load("lib/analytics/types.ts");

const prisma = getPrisma();
const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const grouped = await prisma.productEvent.groupBy({
  by: ["event"],
  where: { createdAt: { gte: since } },
  _count: { _all: true },
  orderBy: { _count: { event: "desc" } },
});

const countByEvent = Object.fromEntries(
  grouped.map((row) => [row.event, row._count._all])
);

const routeGrouped = await prisma.productEvent.groupBy({
  by: ["route"],
  where: { createdAt: { gte: since }, route: { not: null } },
  _count: { _all: true },
  orderBy: { _count: { route: "desc" } },
});

const activationFailures = countByEvent.activation_step_failed ?? 0;
const qualityPassed = countByEvent.article_quality_passed ?? 0;
const qualityFailed = countByEvent.article_quality_failed ?? 0;
const exportClicks = countByEvent.article_export_clicked ?? 0;
const checkoutStarts = countByEvent.checkout_started ?? 0;

console.log(`\nRankBoost funnel report — last ${days} days`);
console.log(`since=${since.toISOString()}`);
console.log(`total_events=${grouped.reduce((n, r) => n + r._count._all, 0)}\n`);

console.log("=== Funnel steps (ordered) ===");
let prev = null;
for (const step of FUNNEL_STEPS) {
  const count = countByEvent[step] ?? 0;
  const drop =
    prev == null || prev === 0
      ? "—"
      : `${Math.max(0, Math.round((1 - count / prev) * 100))}%`;
  console.log(`${step.padEnd(28)} ${String(count).padStart(6)}  drop-off=${drop}`);
  prev = count;
}

console.log("\n=== Activation / quality / export / checkout ===");
console.log(`activation_step_failed     ${activationFailures}`);
console.log(`article_quality_passed     ${qualityPassed}`);
console.log(`article_quality_failed     ${qualityFailed}`);
console.log(`article_export_clicked     ${exportClicks}`);
console.log(`checkout_started           ${checkoutStarts}`);

console.log("\n=== Events by route (top 20) ===");
for (const row of routeGrouped.slice(0, 20)) {
  const route = (row.route || "(null)").slice(0, 60);
  console.log(`${route.padEnd(62)} ${row._count._all}`);
}

console.log("\n=== All known product events ===");
for (const name of PRODUCT_EVENTS) {
  const count = countByEvent[name] ?? 0;
  if (count > 0) {
    console.log(`${name.padEnd(28)} ${count}`);
  }
}

const unknown = grouped.filter((r) => !PRODUCT_EVENTS.includes(r.event));
if (unknown.length) {
  console.log("\n=== Other event names ===");
  for (const row of unknown) {
    console.log(`${row.event.padEnd(28)} ${row._count._all}`);
  }
}

console.log("\n(privacy) report prints aggregates only — no propertiesJson\n");

await prisma.$disconnect();
