/**
 * One-time production cleanup for legacy polluted plan-item-action-3.
 * Usage: vercel env run --environment production -- npx tsx scripts/cleanup-legacy-plan-item.mjs
 */
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

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

const PLAN_ID = "35b352b4-6a7f-479f-a27c-f458a30c18c8";
const ITEM_ID = "plan-item-action-3";

const { getPrisma } = await import(
  pathToFileURL(path.join(process.cwd(), "lib/db.ts")).href
);
const { parsePlanItemsDocument, planItemsToJson } = await import(
  pathToFileURL(path.join(process.cwd(), "lib/autopilot/plan-items.ts")).href
);

const prisma = getPrisma();
const plan = await prisma.monthlyAutopilotPlan.findFirst({
  where: { id: PLAN_ID },
});

if (!plan?.planItemsJson) {
  throw new Error("Plan not found");
}

const document = parsePlanItemsDocument(plan.planItemsJson);
if (!document) {
  throw new Error("Invalid plan items");
}

const itemIndex = document.items.findIndex((item) => item.id === ITEM_ID);
if (itemIndex === -1) {
  throw new Error("Plan item not found");
}

const item = document.items[itemIndex];
if (!item) {
  throw new Error("Plan item missing after index lookup");
}
const blockedBrief = {
  id: `research-${ITEM_ID}`,
  websiteId: plan.websiteId,
  organizationId: plan.organizationId,
  source: "AUTOPILOT_PLAN",
  primaryKeyword: "",
  secondaryKeywords: [],
  searchIntent: "INFORMATIONAL",
  buyerQuestion: "",
  geoPrompts: [],
  competitors: [],
  competitorsUnavailable: true,
  contentGapSummary:
    "Legacy polluted brief cleared. Add a business keyword or Search Console opportunity.",
  recommendedArticleTitle: item.title,
  outline: [],
  faq: [],
  internalLinkSuggestions: ["/", "/blog"],
  schemaSuggestions: ["Article"],
  evidence: [],
  qualityRequirements: [],
  riskLevel: "MEDIUM",
  status: "BLOCKED",
  blockedReason:
    "This looks like a site issue, not an article topic. Regenerate topic/research with a valid keyword.",
  generatedAt: new Date().toISOString(),
};

const updatedItems = [...document.items];
updatedItems[itemIndex] = {
  ...item,
  status: "blocked",
  blockedReasonKey: "unsafeArticleTopic",
  generatedArticleId: undefined,
  articleQualityScore: undefined,
  articleQualityPassed: undefined,
  linkedArticleApprovedAt: undefined,
  sourceRef: undefined,
  researchBrief: blockedBrief,
};

await prisma.monthlyAutopilotPlan.update({
  where: { id: PLAN_ID },
  data: {
    planItemsJson: planItemsToJson({ ...document, items: updatedItems }),
  },
});

console.log(
  JSON.stringify(
    {
      cleaned: true,
      planId: PLAN_ID,
      itemId: ITEM_ID,
      status: "blocked",
      blockedReasonKey: "unsafeArticleTopic",
    },
    null,
    2
  )
);
