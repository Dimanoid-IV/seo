/**
 * Part E (Prompt 11.40): deterministically repair a failed production article
 * so it passes the quality gate — expands to >= 900 words and adds a real CTA
 * using research-grounded content. No Hermes, no publish, no data deletion.
 * Keeps the SAME article id and its link to the plan item.
 *
 * Usage: ./node_modules/.bin/tsx scripts/repair-prod-article.mjs [articleId]
 */
import { pathToFileURL } from "node:url";
import path from "node:path";

const load = (rel) =>
  import(pathToFileURL(path.join(process.cwd(), rel)).href);

const articleId = process.argv[2] || "04aa451a-96bc-48d8-853c-09551f852c96";
const planId = "35b352b4-6a7f-479f-a27c-f458a30c18c8";
const planItemId = "plan-item-action-3";

const { getPrisma } = await load("lib/db.ts");
const { parseContentResearchBrief } = await load("lib/content-research/parse.ts");
const { buildEvidenceNotes } = await load("lib/articles/research-generation-types.ts");
const { validateResearchAwareArticle, qualityReportToIssuesSnapshot } = await load(
  "lib/articles/research-quality-gates.ts"
);
const { repairArticleForQuality, analyzeQualityRepairability, countArticleWords, articleHasCta } =
  await load("lib/articles/repair-article-content.ts");
const { parsePlanItemsDocument, planItemsToJson } = await load(
  "lib/autopilot/plan-items.ts"
);

const prisma = getPrisma();

const article = await prisma.article.findUnique({ where: { id: articleId } });
if (!article) throw new Error("Article not found");

const website = await prisma.website.findUnique({
  where: { id: article.websiteId },
  select: { url: true, niche: true, primaryLanguage: true },
});

const plan = await prisma.monthlyAutopilotPlan.findUnique({ where: { id: planId } });
const document = plan?.planItemsJson ? parsePlanItemsDocument(plan.planItemsJson) : null;
const planItem = document?.items.find((i) => i.id === planItemId);
const brief = planItem?.researchBrief
  ? parseContentResearchBrief(planItem.researchBrief)
  : null;
if (!brief) throw new Error("Research brief for plan item not found");

const language = (article.language || website?.primaryLanguage || "RU").toLowerCase();
const targetKeyword = article.targetKeyword || brief.primaryKeyword;
const evidenceNotesCount = buildEvidenceNotes(brief).length;

const draft = {
  title: article.title,
  slug: article.slug,
  metaTitle: article.metaTitle,
  metaDescription: article.metaDescription,
  contentHtml: article.contentHtml || "",
  faqJson: article.faqJson ?? null,
  schemaJson: article.schemaJson ?? null,
};

const before = {
  words: countArticleWords(draft.contentHtml),
  hasCta: articleHasCta(draft.contentHtml),
};
const beforeReport = validateResearchAwareArticle(draft, {
  targetKeyword,
  brief,
  evidenceNotesCount,
});

const repairability = analyzeQualityRepairability(beforeReport);
if (beforeReport.passed) {
  console.log(JSON.stringify({ note: "already passing; no change", before, score: beforeReport.score }, null, 2));
  process.exit(0);
}
if (!repairability.repairable) {
  console.log(
    JSON.stringify(
      { note: "not deterministically repairable — kept blocked honestly", before, nonRepairableCodes: repairability.nonRepairableCodes },
      null,
      2
    )
  );
  process.exit(0);
}

const repaired = repairArticleForQuality(draft, {
  brief,
  website: { url: website?.url ?? "", niche: website?.niche ?? null, language },
  targetKeyword,
  minWords: 900,
  targetWords: 1150,
});

const afterReport = validateResearchAwareArticle(repaired, {
  targetKeyword,
  brief,
  evidenceNotesCount,
});

const after = {
  words: countArticleWords(repaired.contentHtml),
  hasCta: articleHasCta(repaired.contentHtml),
};

if (!afterReport.passed) {
  console.log(
    JSON.stringify(
      { note: "repair did not pass; NOT writing", before, after, afterScore: afterReport.score, revisionNotes: afterReport.revisionNotes },
      null,
      2
    )
  );
  process.exit(2);
}

const qualityIssuesJson = qualityReportToIssuesSnapshot(
  afterReport,
  (article.qualityRepairAttempts ?? 0) + 1
);

await prisma.article.update({
  where: { id: articleId },
  data: {
    contentHtml: repaired.contentHtml,
    faqJson: repaired.faqJson ?? undefined,
    status: "WAITING_REVIEW",
    qualityScore: afterReport.score,
    qualityPassed: true,
    qualityIssuesJson: qualityIssuesJson,
    qualityRepairAttempts: (article.qualityRepairAttempts ?? 0) + 1,
  },
});

// Relink / update the plan item so it reflects the passing article.
if (document && planItem) {
  const idx = document.items.findIndex((i) => i.id === planItemId);
  document.items[idx] = {
    ...planItem,
    status: "prepared",
    generatedArticleId: articleId,
    sourceRef: { type: "article", id: articleId },
    articleQualityScore: afterReport.score,
    articleQualityPassed: true,
    reviewQueueHref: "/app/review",
    blockedReasonKey: undefined,
  };
  await prisma.monthlyAutopilotPlan.update({
    where: { id: planId },
    data: { planItemsJson: planItemsToJson(document) },
  });
}

console.log(
  JSON.stringify(
    {
      repaired: true,
      articleId,
      title: repaired.title,
      status: "WAITING_REVIEW",
      before,
      after,
      beforeScore: beforeReport.score,
      afterScore: afterReport.score,
      afterPassed: afterReport.passed,
      planItemStatus: "prepared",
    },
    null,
    2
  )
);
