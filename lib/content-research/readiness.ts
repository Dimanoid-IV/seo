import { ArticleStatus } from "@prisma/client";

import { isUnsafeArticleTopic } from "./keywords";
import { parseContentResearchBrief } from "./parse";
import type { ContentResearchBrief } from "./types";

export type ResearchReadinessReasonKey =
  | "missingBrief"
  | "invalidBrief"
  | "notReadyForGeneration"
  | "missingPrimaryKeyword"
  | "missingBuyerQuestion"
  | "missingGeoPrompts"
  | "unsafePrimaryKeyword"
  | "unsafeRecommendedTitle"
  | "archivedLinkedArticle"
  | "linkedArticleQualityFailed";

export type ResearchBriefReadinessContext = {
  linkedArticle?: {
    status: ArticleStatus;
    qualityPassed: boolean | null;
  } | null;
};

export type ResearchBriefReadinessResult = {
  ready: boolean;
  reasonKey?: ResearchReadinessReasonKey;
};

function analyzeBriefContent(
  brief: ContentResearchBrief
): ResearchBriefReadinessResult {
  if (brief.status !== "READY_FOR_GENERATION") {
    return { ready: false, reasonKey: "notReadyForGeneration" };
  }

  if (!brief.primaryKeyword.trim()) {
    return { ready: false, reasonKey: "missingPrimaryKeyword" };
  }

  if (isUnsafeArticleTopic(brief.primaryKeyword)) {
    return { ready: false, reasonKey: "unsafePrimaryKeyword" };
  }

  if (
    brief.recommendedArticleTitle.trim() &&
    isUnsafeArticleTopic(brief.recommendedArticleTitle)
  ) {
    return { ready: false, reasonKey: "unsafeRecommendedTitle" };
  }

  if (!brief.buyerQuestion.trim()) {
    return { ready: false, reasonKey: "missingBuyerQuestion" };
  }

  if (brief.geoPrompts.length < 1) {
    return { ready: false, reasonKey: "missingGeoPrompts" };
  }

  return { ready: true };
}

/** Deterministic readiness analysis for article generation. */
export function analyzeResearchBriefReadiness(
  briefJson: unknown,
  context?: ResearchBriefReadinessContext
): ResearchBriefReadinessResult {
  const brief = parseContentResearchBrief(briefJson);
  if (!brief) {
    return { ready: false, reasonKey: "invalidBrief" };
  }

  if (context?.linkedArticle?.status === ArticleStatus.ARCHIVED) {
    return { ready: false, reasonKey: "archivedLinkedArticle" };
  }

  if (
    context?.linkedArticle &&
    context.linkedArticle.qualityPassed === false
  ) {
    return { ready: false, reasonKey: "linkedArticleQualityFailed" };
  }

  return analyzeBriefContent(brief);
}

/** True when a stored research brief is ready for Hermes article generation. */
export function isResearchBriefReadyForArticleGeneration(
  briefJson: unknown,
  context?: ResearchBriefReadinessContext
): boolean {
  if (!briefJson) {
    return false;
  }

  return analyzeResearchBriefReadiness(briefJson, context).ready;
}
