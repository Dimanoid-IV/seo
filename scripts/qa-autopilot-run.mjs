/**
 * Controlled production autopilot QA runner (dry-run or real run).
 * Usage:
 *   vercel env run --environment production -- node scripts/qa-autopilot-run.mjs --dry-run
 *   vercel env run --environment production -- node scripts/qa-autopilot-run.mjs
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);

process.env.NODE_PATH = [
  path.join(process.cwd(), "scripts/stubs"),
  process.env.NODE_PATH,
]
  .filter(Boolean)
  .join(path.delimiter);
require("module").Module._initPaths();

const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  exports: {},
  loaded: true,
  id: serverOnlyPath,
  filename: serverOnlyPath,
  children: [],
  paths: [],
  parent: null,
  path: path.dirname(serverOnlyPath),
};

const dryRun = process.argv.includes("--dry-run");
const reconcileOnly = process.argv.includes("--reconcile-only");
const refreshResearch = process.argv.includes("--refresh-research");
const userId = "61e2d0aa-1c3d-48d0-8520-900dca3aef4e";
const organizationId = "e418a366-67bb-4e05-b27c-c80226b5f48f";
const websiteId = "ab7c514d-0e09-41fc-b0da-845479c6c382";
const planId = "35b352b4-6a7f-479f-a27c-f458a30c18c8";
const articleItemId = "plan-item-action-3";

if (reconcileOnly) {
  const { getPrisma } = await import(
    pathToFileURL(path.join(process.cwd(), "lib/db.ts")).href
  );
  const {
    parsePlanItemsDocument,
    planItemsToJson,
    reconcileArticleDraftSchedulingBlocks,
  } = await import(
    pathToFileURL(path.join(process.cwd(), "lib/autopilot/plan-items.ts")).href
  );

  const prisma = getPrisma();
  const plan = await prisma.monthlyAutopilotPlan.findFirst({
    where: { id: planId },
  });
  if (!plan?.planItemsJson) {
    throw new Error("Plan items missing");
  }
  const document = parsePlanItemsDocument(plan.planItemsJson);
  if (!document) {
    throw new Error("Invalid plan items");
  }
  const reconciled = reconcileArticleDraftSchedulingBlocks({
    document,
    approvedAt: plan.approvedAt,
  });
  await prisma.monthlyAutopilotPlan.update({
    where: { id: planId },
    data: { planItemsJson: planItemsToJson(reconciled) },
  });
  console.log(JSON.stringify({ reconciled: true, itemCount: reconciled.items.length }, null, 2));
  process.exit(0);
}

if (refreshResearch) {
  const { refreshAutopilotPlanItemResearchBrief } = await import(
    pathToFileURL(
      path.join(process.cwd(), "lib/content-research/refresh-plan-item-brief.ts")
    ).href
  );
  const result = await refreshAutopilotPlanItemResearchBrief({
    planId,
    itemId: articleItemId,
    userId,
    organizationId,
  });
  console.log(
    JSON.stringify(
      {
        refreshed: true,
        itemId: result.planItemId,
        hasBrief: Boolean(result.brief),
        summary: result.summary,
      },
      null,
      2
    )
  );
  process.exit(0);
}

const { runScheduledAutopilotPlans } = await import(
  pathToFileURL(path.join(process.cwd(), "lib/autopilot/run-scheduled-plan.ts")).href
);

const report = await runScheduledAutopilotPlans({
  userId,
  organizationId,
  websiteId,
  dryRun,
});

const safe = {
  dryRun: report.dryRun,
  plansScanned: report.plansScanned,
  dueItemsFound: report.dueItemsFound,
  executedCount: report.executedCount,
  skippedCount: report.skippedCount,
  blockedCount: report.blockedCount,
  errorCount: report.errorCount,
  results: report.results.map((r) => ({
    planItemId: r.planItemId,
    itemTitle: r.itemTitle,
    action: r.action,
    reasonKey: r.reasonKey,
    summaryKey: r.summaryKey,
    eligible: r.eligible,
    executed: r.executed,
    error: r.error,
    nextStatus: r.nextStatus,
  })),
};

console.log(JSON.stringify(safe, null, 2));
