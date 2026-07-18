import "server-only";

import type { ContentResearchBrief } from "@/lib/content-research/types";

/**
 * Builds Hermes task context from a ContentResearchBrief.
 * Passed via task.recommendationJson — no Hermes API changes required.
 */
export function buildResearchTaskContext(brief: ContentResearchBrief) {
  const competitorAngles = brief.competitors.flatMap((c) => c.contentAngles);
  const competitorGaps = brief.competitors.map(
    (c) => `${c.name}: ${c.reason}`
  );

  return {
    contentResearchBrief: {
      id: brief.id,
      primaryKeyword: brief.primaryKeyword,
      secondaryKeywords: brief.secondaryKeywords,
      searchIntent: brief.searchIntent,
      buyerQuestion: brief.buyerQuestion,
      geoPrompts: brief.geoPrompts,
      competitors: brief.competitors,
      competitorsUnavailable: brief.competitorsUnavailable,
      contentGapSummary: brief.contentGapSummary,
      recommendedArticleTitle: brief.recommendedArticleTitle,
      outline: brief.outline,
      faq: brief.faq,
      internalLinkSuggestions: brief.internalLinkSuggestions,
      schemaSuggestions: brief.schemaSuggestions,
      qualityRequirements: brief.qualityRequirements,
      evidence: brief.evidence,
      riskLevel: brief.riskLevel,
    },
    generationInstructions: [
      "Write in a human, non-generic voice for a small business owner.",
      "Write a thorough, in-depth article of at least 1000 words (aim for 1000–1300).",
      "Structure: H1 title, short intro, 5–7 useful H2 sections with practical buying/decision advice, an FAQ, and a final call-to-action section.",
      "End with a natural, non-aggressive call-to-action that invites the reader to order/request the service or contact the business, relevant to the topic and website.",
      "Use concrete language from the research brief and website context.",
      "Vary sentence rhythm; avoid robotic section sameness.",
      "Preserve SEO structure without keyword stuffing.",
      "Include FAQ naturally within the article flow.",
      "Title and meta description must sound human, not templated.",
      `Address the buyer question: "${brief.buyerQuestion}"`,
      "Reference GEO / AI-search angles where relevant.",
      brief.internalLinkSuggestions.length > 0
        ? `Suggest internal links where natural: ${brief.internalLinkSuggestions.slice(0, 5).join(", ")}`
        : "",
      ...brief.qualityRequirements,
      "No fake claims, no guaranteed rankings, no made-up statistics.",
      "Do not write as an AI assistant.",
      competitorAngles.length > 0
        ? `Differentiate from competitors using angles: ${competitorAngles.slice(0, 5).join("; ")}`
        : "Focus on practical value for the business owner.",
      competitorGaps.length > 0
        ? `Content gaps to address: ${competitorGaps.slice(0, 3).join("; ")}`
        : brief.contentGapSummary,
    ].filter(Boolean),
    competitorAngles,
    internalLinkSuggestions: brief.internalLinkSuggestions,
    schemaSuggestions: brief.schemaSuggestions,
  };
}

export function resolveTopicFromBrief(brief: ContentResearchBrief): string {
  return (
    brief.recommendedArticleTitle.trim() ||
    brief.primaryKeyword.trim() ||
    "Article draft"
  );
}

export function resolveTargetKeywordFromBrief(
  brief: ContentResearchBrief
): string {
  return brief.primaryKeyword.trim();
}
