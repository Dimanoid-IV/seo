import { isUnsafeArticleTopic } from "@/lib/content-research/keywords";

import { assessArticleQualityDimensions } from "./quality-dimensions";

export type PublishQualityArticle = {
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  contentHtml?: string | null;
  targetKeyword?: string | null;
  language?: string | null;
};

export type PublishQualityResult = {
  passed: boolean;
  overall: number;
  factualConfidence: number;
  criticalFlags: string[];
};

const PROMPT_LEAKAGE_PATTERNS = [
  /research brief/i,
  /quality requirements?/i,
  /brand voice constraints?/i,
  /generation instructions?/i,
  /competitor gaps?/i,
  /тема построена вокруг покупательского запроса/i,
  /бриф (?:проверит|исследован)/i,
  /research[- ]?agent/i,
];

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fail-closed publication-time validation for current article fields.
 * This deliberately does not trust a historical `qualityPassed` database flag.
 */
export function evaluateCurrentArticlePublishQuality(
  article: PublishQualityArticle
): PublishQualityResult {
  const contentHtml = article.contentHtml?.trim() ?? "";
  const body = stripHtml(contentHtml);
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const targetKeyword = article.targetKeyword?.trim() ?? article.title.trim();
  const dimensions = assessArticleQualityDimensions({
    title: article.title,
    metaTitle: article.metaTitle ?? "",
    metaDescription: article.metaDescription ?? "",
    contentHtml,
    primaryKeyword: targetKeyword,
    evidenceCount: 0,
    brandProfileAvailable: true,
  });
  const criticalFlags = new Set(dimensions.criticalFlags);
  const searchable = `${article.title} ${article.metaTitle ?? ""} ${article.metaDescription ?? ""} ${body}`;

  if (!article.title.trim() || !article.metaTitle?.trim() || !article.metaDescription?.trim()) {
    criticalFlags.add("missing_required_metadata");
  }
  if (!contentHtml || wordCount < 700) criticalFlags.add("insufficient_content");
  if (isUnsafeArticleTopic(article.title) || isUnsafeArticleTopic(targetKeyword)) {
    criticalFlags.add("unsafe_topic");
  }
  if (PROMPT_LEAKAGE_PATTERNS.some((pattern) => pattern.test(searchable))) {
    criticalFlags.add("prompt_leakage");
  }

  return {
    passed:
      dimensions.overall >= 85 &&
      dimensions.factualConfidence >= 80 &&
      criticalFlags.size === 0,
    overall: dimensions.overall,
    factualConfidence: dimensions.factualConfidence,
    criticalFlags: [...criticalFlags],
  };
}
