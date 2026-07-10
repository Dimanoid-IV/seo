import "server-only";

import { randomUUID } from "crypto";

import type { ContentResearchBrief, ContentResearchSource, ResearchEvidence } from "./types";
import { generateGeoPrompts } from "./geo-prompts";
import {
  keywordToBuyerQuestion,
} from "./intent";
import {
  extractKeywordCandidates,
  pickPrimaryKeyword,
  pickSecondaryKeywords,
} from "./keywords";
import {
  localeFromWebsiteLanguage,
  loadResearchSourceContext,
  resolveCompetitorsFromContext,
  type ResearchSourceContext,
} from "./source-context";

export type GenerateBriefInput = {
  websiteId: string;
  organizationId: string;
  userId: string;
  source: ContentResearchSource;
  briefId?: string;
  planItemTitle?: string;
  planItemReason?: string;
  manualKeyword?: string;
  manualTopic?: string;
  taskId?: string;
  articleId?: string;
  focusAreaTitles?: string[];
  riskLevel?: ContentResearchBrief["riskLevel"];
  /** Pre-loaded context to avoid duplicate DB reads */
  context?: ResearchSourceContext;
  /** Skip optional Hermes enhancement */
  skipHermesEnhance?: boolean;
};

function buildOutline(keyword: string): string[] {
  return [
    `Introduction: why "${keyword}" matters for your audience`,
    `What buyers ask before choosing (buyer questions)`,
    `Key criteria and comparison points`,
    `Practical steps or recommendations`,
    `FAQ: common questions about ${keyword}`,
    "Next steps and internal links",
  ];
}

function buildFaq(buyerQuestion: string, keyword: string): string[] {
  return [
    buyerQuestion,
    `How long does it take to see results for "${keyword}"?`,
    `What mistakes should I avoid when choosing a provider for "${keyword}"?`,
  ];
}

function buildQualityRequirements(): string[] {
  return [
    "No fake claims or guaranteed rankings",
    "Write for a small business owner audience",
    "Include FAQ and meta title/description",
    "Use evidence from audit, tasks, or Search Console where available",
    "Suggest schema markup where appropriate",
  ];
}

function buildSchemaSuggestions(intent: string): string[] {
  const base = ["Article", "FAQPage"];
  if (intent === "LOCAL") {
    base.push("LocalBusiness");
  }
  if (intent === "COMPARISON" || intent === "COMMERCIAL") {
    base.push("HowTo");
  }
  return base;
}

function buildEvidence(
  context: ResearchSourceContext,
  primarySource: string
): ResearchEvidence[] {
  const evidence: ResearchEvidence[] = [];

  if (context.gscConnected) {
    evidence.push({
      source: "GSC",
      label: "Search Console connected",
      value: "Site has recent search performance data for opportunity detection.",
    });
  }

  if (context.contentTasks.length > 0) {
    evidence.push({
      source: "TASK",
      label: "Open content tasks",
      value: `${context.contentTasks.length} content task(s) inform this brief.`,
    });
  }

  if (context.auditFindings.length > 0) {
    evidence.push({
      source: "AUDIT",
      label: "Audit findings",
      value: `${context.auditFindings.length} high-priority audit finding(s) considered.`,
    });
  }

  if (primarySource) {
    evidence.push({
      source: "MANUAL",
      label: "Primary keyword source",
      value: primarySource,
    });
  }

  return evidence.slice(0, 8);
}

function buildContentGapSummary(
  keyword: string,
  competitorsUnavailable: boolean,
  locale: "en" | "ru" | "et"
): string {
  if (locale === "ru") {
    return competitorsUnavailable
      ? `Контент по запросу «${keyword}» поможет закрыть пробел в темах, которые RankBoost нашёл в задачах и аудите. Данные о конкурентах будут добавлены после Search Console или ручного ввода.`
      : `Статья по «${keyword}» закроет контентный пробел относительно конкурентов и усилит видимость в поиске и AI-ответах.`;
  }
  if (locale === "et") {
    return competitorsUnavailable
      ? `Sisu päringule „${keyword}" aitab sulgeda lünki, mille RankBoost leidis ülesannetest ja auditist. Konkurentide andmed lisatakse pärast Search Console'i või käsitsi sisestust.`
      : `Artikkel „${keyword}" kohta sulgeb konkurentide suhtes sisu lünga ja tugevdab nähtavust otsingus ja AI-vastustes.`;
  }
  return competitorsUnavailable
    ? `Content for "${keyword}" addresses gaps RankBoost found in tasks and audit. Competitor data will be added after Search Console or manual input.`
    : `An article on "${keyword}" closes a content gap vs competitors and improves search and AI answer visibility.`;
}

function buildRecommendedTitle(
  keyword: string,
  intent: string,
  locale: "en" | "ru" | "et"
): string {
  if (locale === "ru") {
    if (intent === "COMPARISON") return `Как выбрать лучший вариант: ${keyword}`;
    if (intent === "LOCAL") return `${keyword}: гид для локального бизнеса`;
    return `Полное руководство: ${keyword}`;
  }
  if (locale === "et") {
    if (intent === "COMPARISON") return `Kuidas valida parim: ${keyword}`;
    if (intent === "LOCAL") return `${keyword}: juhend kohalikule ettevõttele`;
    return `Täielik juhend: ${keyword}`;
  }
  if (intent === "COMPARISON") return `How to choose the best: ${keyword}`;
  if (intent === "LOCAL") return `${keyword}: a guide for local businesses`;
  return `Complete guide: ${keyword}`;
}

/**
 * Generates a content research brief from existing website data (deterministic).
 * Optional Hermes enhancement runs separately and fails gracefully.
 */
export async function generateContentResearchBrief(
  input: GenerateBriefInput
): Promise<ContentResearchBrief> {
  const context =
    input.context ??
    (await loadResearchSourceContext({
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      userId: input.userId,
      focusAreaTitles: input.focusAreaTitles,
    }));

  const locale = localeFromWebsiteLanguage(context.website.primaryLanguage);

  const linkedTask = input.taskId
    ? context.contentTasks.find((t) => t.id === input.taskId)
    : undefined;

  const linkedArticle = input.articleId
    ? context.articles.find((a) => a.id === input.articleId)
    : undefined;

  const keywordCandidates = extractKeywordCandidates({
    planItemTitle: input.planItemTitle,
    planItemReason: input.planItemReason,
    manualKeyword: input.manualKeyword,
    manualTopic: input.manualTopic,
    article: linkedArticle,
    task: linkedTask,
    opportunities: context.opportunities,
    auditFindings: context.auditFindings,
    gscInsightTitles: context.gscInsightTitles,
    focusAreaTitles: context.focusAreaTitles,
    niche: context.website.niche,
  });

  const primary = pickPrimaryKeyword(keywordCandidates);

  if (!primary) {
    return {
      id: input.briefId ?? randomUUID(),
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      source: input.source,
      targetUrl: context.website.url,
      primaryKeyword: "",
      secondaryKeywords: [],
      searchIntent: "INFORMATIONAL",
      buyerQuestion: "",
      geoPrompts: [],
      competitors: [],
      competitorsUnavailable: true,
      contentGapSummary:
        locale === "ru"
          ? "Недостаточно данных для ключевого запроса. Добавьте задачу, тему статьи или подключите Search Console."
          : locale === "et"
            ? "Põhi päringu jaoks pole piisavalt andmeid. Lisage ülesanne, artikli teema või ühendage Search Console."
            : "Not enough data for a primary keyword. Add a task, article topic, or connect Search Console.",
      recommendedArticleTitle: input.planItemTitle ?? input.manualTopic ?? "",
      outline: [],
      faq: [],
      internalLinkSuggestions: ["/", "/blog"],
      schemaSuggestions: ["Article"],
      evidence: buildEvidence(context, "none"),
      qualityRequirements: buildQualityRequirements(),
      riskLevel: input.riskLevel ?? "MEDIUM",
      status: "BLOCKED",
      blockedReason:
        locale === "ru"
          ? "Не удалось определить ключевой запрос из доступных данных."
          : locale === "et"
            ? "Põhipäringut ei õnnestunud olemasolevatest andmetest tuvastada."
            : "Could not determine a primary keyword from available data.",
      generatedAt: new Date().toISOString(),
    };
  }

  const searchIntent = primary.searchIntent;
  const buyerQuestion = keywordToBuyerQuestion(
    primary.keyword,
    searchIntent,
    locale
  );
  const secondaryKeywords = pickSecondaryKeywords(keywordCandidates, primary);

  const competitorResult = resolveCompetitorsFromContext(context);

  const geoPrompts = generateGeoPrompts({
    primaryKeyword: primary.keyword,
    searchIntent,
    niche: context.website.niche,
    businessName: context.website.displayName,
    locale,
  });

  const brief: ContentResearchBrief = {
    id: input.briefId ?? randomUUID(),
    websiteId: input.websiteId,
    organizationId: input.organizationId,
    source: input.source,
    targetUrl: context.website.url,
    primaryKeyword: primary.keyword,
    secondaryKeywords,
    searchIntent,
    buyerQuestion,
    geoPrompts,
    competitors: competitorResult.competitors,
    competitorsUnavailable: competitorResult.unavailable,
    contentGapSummary: buildContentGapSummary(
      primary.keyword,
      competitorResult.unavailable,
      locale
    ),
    recommendedArticleTitle: buildRecommendedTitle(
      primary.keyword,
      searchIntent,
      locale
    ),
    outline: buildOutline(primary.keyword),
    faq: buildFaq(buyerQuestion, primary.keyword),
    internalLinkSuggestions: ["/", "/services", "/blog"],
    schemaSuggestions: buildSchemaSuggestions(searchIntent),
    llmsTxtSuggestion: `Add a concise summary of "${primary.keyword}" to llms.txt for AI crawlers.`,
    aiReadableSummarySuggestion: `One-paragraph factual summary about ${primary.keyword} for ${context.website.displayName ?? "your business"}.`,
    evidence: buildEvidence(context, primary.sourceLabel),
    qualityRequirements: buildQualityRequirements(),
    riskLevel: input.riskLevel ?? "MEDIUM",
    status: "READY_FOR_GENERATION",
    generatedAt: new Date().toISOString(),
  };

  if (competitorResult.unavailable && !context.gscConnected && keywordCandidates.length < 2) {
    brief.status = "DRAFT";
  }

  if (!input.skipHermesEnhance) {
    try {
      const { tryEnhanceBriefWithHermes } = await import("./hermes-enhance");
      return await tryEnhanceBriefWithHermes(brief, context);
    } catch {
      return brief;
    }
  }

  return brief;
}

export { getResearchDisplayStatus, toResearchBriefSummary } from "./types";
