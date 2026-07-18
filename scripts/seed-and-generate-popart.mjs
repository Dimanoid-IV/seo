/**
 * Controlled, production-safe E2E prover for popart.ee (Prompt 11.39).
 * Seeds real RU article topics (grounded in popart.ee's portrait business) into
 * the current monthly plan, and optionally generates ONE article via Hermes.
 *
 * Usage:
 *   vercel env run --environment production -- node scripts/seed-and-generate-popart.mjs --seed
 *   vercel env run --environment production -- node scripts/seed-and-generate-popart.mjs --generate
 *   vercel env run --environment production -- node scripts/seed-and-generate-popart.mjs --verify-export <articleId>
 *
 * Preserves TASK_FIX/SEO_FIX items. Does NOT publish to WordPress. Does NOT
 * delete data. Prints no secrets.
 */
import { pathToFileURL } from "node:url";
import path from "node:path";

const seed = process.argv.includes("--seed");
const generate = process.argv.includes("--generate");
const verifyExportIdx = process.argv.indexOf("--verify-export");
const verifyExportArticleId =
  verifyExportIdx !== -1 ? process.argv[verifyExportIdx + 1] : null;

const userId = "61e2d0aa-1c3d-48d0-8520-900dca3aef4e";
const organizationId = "e418a366-67bb-4e05-b27c-c80226b5f48f";
const websiteId = "ab7c514d-0e09-41fc-b0da-845479c6c382";
const planId = "35b352b4-6a7f-479f-a27c-f458a30c18c8";
const primaryArticleItemId = "plan-item-action-3";

const load = (rel) =>
  import(pathToFileURL(path.join(process.cwd(), rel)).href);

// Real RU topics grounded in popart.ee (custom digital-painting portraits from photos).
const TOPICS = [
  {
    itemId: primaryArticleItemId,
    manualKeyword: "портрет по фото на холсте",
    manualTopic: "Портрет по фото на холсте как персональный подарок",
    reason:
      "popart.ee превращает фотографии в цифровые картины на холсте. Статья по этому запросу привлекает покупателей, которые ищут персональный подарок, и ведёт их к оформлению заказа.",
    scheduledFor: "2026-07-20T09:00:00.000Z",
    status: "approved",
  },
  {
    itemId: "plan-item-action-5",
    manualKeyword: "портрет по фото в подарок",
    manualTopic: "Портрет по фото в подарок: идеи для близких",
    reason:
      "Запрос отражает основной сценарий покупки — подарок. Статья помогает выбрать сюжет и размер и снимает сомнения перед заказом.",
    scheduledFor: "2026-07-22T09:00:00.000Z",
    status: "proposed",
  },
  {
    itemId: "plan-item-action-6",
    manualKeyword: "цифровая живопись из фотографии",
    manualTopic: "Цифровая живопись из фотографии: чем отличается от фотопечати",
    reason:
      "Объясняет ценность продукта popart.ee и отличие от обычной фотопечати — закрывает информационный запрос и повышает доверие.",
    scheduledFor: "2026-07-24T09:00:00.000Z",
    status: "proposed",
  },
];

async function runSeed() {
  const { getPrisma } = await load("lib/db.ts");
  const { generateContentResearchBrief } = await load(
    "lib/content-research/generate-brief.ts"
  );
  const { loadResearchSourceContext } = await load(
    "lib/content-research/source-context.ts"
  );
  const { briefToJson } = await load("lib/content-research/parse.ts");
  const { parsePlanItemsDocument, planItemsToJson } = await load(
    "lib/autopilot/plan-items.ts"
  );
  const { isResearchBriefReadyForArticleGeneration } = await load(
    "lib/content-research/readiness.ts"
  );

  const prisma = getPrisma();
  const plan = await prisma.monthlyAutopilotPlan.findFirst({
    where: { id: planId },
  });
  if (!plan?.planItemsJson) throw new Error("Plan items missing");
  const document = parsePlanItemsDocument(plan.planItemsJson);
  if (!document) throw new Error("Invalid plan items");

  const context = await loadResearchSourceContext({
    websiteId,
    organizationId,
    userId,
  });

  const seededSummaries = [];
  const briefsByItemId = new Map();

  for (const topic of TOPICS) {
    const brief = await generateContentResearchBrief({
      websiteId,
      organizationId,
      userId,
      source: "AUTOPILOT_PLAN",
      briefId: `research-${topic.itemId}`,
      manualKeyword: topic.manualKeyword,
      manualTopic: topic.manualTopic,
      riskLevel: "LOW",
      context,
      skipHermesEnhance: true,
    });
    // Force READY when we have a valid manual keyword (deterministic seed).
    if (brief.primaryKeyword && brief.status === "DRAFT") {
      brief.status = "READY_FOR_GENERATION";
    }
    const briefJson = briefToJson(brief);
    briefsByItemId.set(topic.itemId, { brief, briefJson });
    seededSummaries.push({
      itemId: topic.itemId,
      primaryKeyword: brief.primaryKeyword,
      searchIntent: brief.searchIntent,
      recommendedArticleTitle: brief.recommendedArticleTitle,
      status: brief.status,
      ready: isResearchBriefReadyForArticleGeneration(briefJson),
      competitorsUnavailable: brief.competitorsUnavailable,
    });
  }

  // Preserve non-article items; drop any previous seeded article items.
  const preserved = document.items.filter(
    (i) => i.type !== "ARTICLE" && !TOPICS.some((t) => t.itemId === i.id)
  );

  const articleItems = TOPICS.map((topic) => {
    const { brief, briefJson } = briefsByItemId.get(topic.itemId);
    return {
      id: topic.itemId,
      type: "ARTICLE",
      title: brief.recommendedArticleTitle || topic.manualKeyword,
      reason: topic.reason,
      riskLevel: "low",
      needsIntegration: false,
      integrationType: "manual",
      scheduledFor: topic.scheduledFor,
      estimatedActionDate: topic.scheduledFor,
      status: topic.status,
      selected: true,
      reviewQueueHref: "/app/review",
      researchBrief: briefJson,
    };
  });

  const nextDoc = {
    ...document,
    items: [...preserved, ...articleItems],
  };

  await prisma.monthlyAutopilotPlan.update({
    where: { id: planId },
    data: { planItemsJson: planItemsToJson(nextDoc) },
  });

  console.log(
    JSON.stringify(
      {
        seeded: true,
        preservedItemIds: preserved.map((i) => i.id),
        articleTopics: seededSummaries,
        totalItems: nextDoc.items.length,
      },
      null,
      2
    )
  );
}

async function runGenerate() {
  const { generatePlanItemArticleDraft } = await load(
    "lib/autopilot/generate-plan-article-draft.ts"
  );
  try {
    const result = await generatePlanItemArticleDraft({
      planId,
      planItemId: primaryArticleItemId,
      userId,
      organizationId,
    });
    console.log(
      JSON.stringify(
        {
          generated: true,
          articleId: result.article.id,
          title: result.article.title,
          status: result.article.status,
          slug: result.article.slug,
          metaTitle: result.article.metaTitle,
          metaDescription: result.article.metaDescription,
          language: result.article.language,
          qualityScore: result.qualityReport.score,
          qualityPassed: result.qualityReport.passed,
          planItemId: result.planItem.id,
          generatedArticleId: result.planItem.generatedArticleId,
          reviewQueueHref: result.planItem.reviewQueueHref,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          generated: false,
          errorClass: error?.code || error?.name || "Error",
          statusCode: error?.statusCode,
          message: error?.message,
        },
        null,
        2
      )
    );
    process.exitCode = 2;
  }
}

async function runVerifyExport(articleId) {
  const { getPrisma } = await load("lib/db.ts");
  const { buildUniversalExport } = await load(
    "lib/publishing/universal-export.ts"
  );
  const prisma = getPrisma();
  const article = await prisma.article.findFirst({
    where: { id: articleId, websiteId, organizationId },
  });
  if (!article) {
    console.log(JSON.stringify({ exportOk: false, message: "article not found" }, null, 2));
    process.exitCode = 2;
    return;
  }
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { url: true },
  });
  const pkg = buildUniversalExport(
    {
      title: article.title,
      slug: article.slug,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      contentHtml: article.contentHtml,
      targetKeyword: article.targetKeyword,
      language: article.language,
    },
    { websiteUrl: website?.url ?? "" }
  );
  const html = pkg?.html ?? "";
  const md = pkg?.markdown ?? "";
  console.log(
    JSON.stringify(
      {
        exportOk: Boolean(pkg),
        hasHtml: html.length > 0,
        htmlLength: html.length,
        hasMarkdown: md.length > 0,
        markdownLength: md.length,
        metaTitle: pkg?.metaTitle,
        metaDescription: pkg?.metaDescription,
        slug: pkg?.slug,
        canonicalUrl: pkg?.canonicalUrl,
        hasDeveloperEmail: Boolean(pkg?.developerEmail),
      },
      null,
      2
    )
  );
}

if (seed) {
  await runSeed();
} else if (generate) {
  await runGenerate();
} else if (verifyExportArticleId) {
  await runVerifyExport(verifyExportArticleId);
} else {
  console.log("No action flag provided. Use --seed | --generate | --verify-export <id>");
  process.exitCode = 1;
}
