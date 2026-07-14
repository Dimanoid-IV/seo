/**
 * Content research brief — runs BEFORE article generation (Prompt 11.22).
 *
 * Persistence: embedded in AutopilotPlanItem.researchBrief inside planItemsJson.
 * No separate Prisma model — avoids conflicting content models.
 */

import { isUnsafeArticleTopic } from "./keywords";

export type ContentResearchSource =
  | "AUTOPILOT_PLAN"
  | "MANUAL_ARTICLE"
  | "TASK"
  | "GSC"
  | "AUDIT";

export type SearchIntent =
  | "INFORMATIONAL"
  | "COMMERCIAL"
  | "TRANSACTIONAL"
  | "NAVIGATIONAL"
  | "LOCAL"
  | "COMPARISON";

export type GeoPlatform =
  | "CHATGPT"
  | "GEMINI"
  | "PERPLEXITY"
  | "GOOGLE_AI"
  | "CLAUDE"
  | "GENERIC";

export type ResearchEvidenceSource =
  | "GSC"
  | "AUDIT"
  | "TASK"
  | "COMPETITOR"
  | "AI_PROMPT"
  | "MANUAL";

export type ResearchBriefStatus = "DRAFT" | "READY_FOR_GENERATION" | "BLOCKED";

export type ResearchDisplayStatus = "ready" | "partial" | "blocked";

export type GeoPrompt = {
  prompt: string;
  platform: GeoPlatform;
  desiredMentionAngle: string;
};

export type CompetitorInsight = {
  domain: string;
  name: string;
  reason: string;
  observedStrengths: string[];
  contentAngles: string[];
};

export type ResearchEvidence = {
  source: ResearchEvidenceSource;
  label: string;
  value: string;
};

export type ContentResearchBrief = {
  /** Stable key: plan-item id, task id, or generated uuid */
  id: string;
  websiteId: string;
  organizationId: string;
  source: ContentResearchSource;
  targetUrl?: string;
  targetPage?: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent;
  buyerQuestion: string;
  geoPrompts: GeoPrompt[];
  competitors: CompetitorInsight[];
  /** True when no competitor data was available */
  competitorsUnavailable?: boolean;
  contentGapSummary: string;
  recommendedArticleTitle: string;
  outline: string[];
  faq: string[];
  internalLinkSuggestions: string[];
  schemaSuggestions: string[];
  llmsTxtSuggestion?: string;
  aiReadableSummarySuggestion?: string;
  evidence: ResearchEvidence[];
  qualityRequirements: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  status: ResearchBriefStatus;
  blockedReason?: string;
  generatedAt: string;
  /** Optional Hermes enhancement metadata — never required */
  hermesEnhanced?: boolean;
};

/** Lightweight summary for plan approval UI */
export type ContentResearchBriefSummary = {
  primaryKeyword: string;
  buyerQuestion: string;
  geoPromptCount: number;
  competitorCount: number;
  competitorsUnavailable: boolean;
  displayStatus: ResearchDisplayStatus;
  status: ResearchBriefStatus;
};

export function getResearchDisplayStatus(
  brief: Pick<
    ContentResearchBrief,
    "status" | "primaryKeyword" | "buyerQuestion" | "geoPrompts" | "blockedReason" | "recommendedArticleTitle"
  >
): ResearchDisplayStatus {
  if (brief.status === "BLOCKED" || !brief.primaryKeyword.trim()) {
    return "blocked";
  }

  if (
    isUnsafeArticleTopic(brief.primaryKeyword) ||
    (brief.recommendedArticleTitle?.trim() &&
      isUnsafeArticleTopic(brief.recommendedArticleTitle))
  ) {
    return "blocked";
  }

  const hasCore =
    brief.primaryKeyword.trim().length > 0 &&
    brief.buyerQuestion.trim().length > 0 &&
    brief.geoPrompts.length >= 1;

  if (brief.status === "READY_FOR_GENERATION" && hasCore) {
    return "ready";
  }

  return "partial";
}

export function toResearchBriefSummary(
  brief: ContentResearchBrief
): ContentResearchBriefSummary {
  return {
    primaryKeyword: brief.primaryKeyword,
    buyerQuestion: brief.buyerQuestion,
    geoPromptCount: brief.geoPrompts.length,
    competitorCount: brief.competitors.length,
    competitorsUnavailable: Boolean(brief.competitorsUnavailable),
    displayStatus: getResearchDisplayStatus(brief),
    status: brief.status,
  };
}
