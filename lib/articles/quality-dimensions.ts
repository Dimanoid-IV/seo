export type QualityDimensions = {
  contentQuality: number;
  seo: number;
  brandMatch: number;
  factualConfidence: number;
  readability: number;
  commercialRelevance: number;
  overall: number;
  criticalFlags: string[];
};

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function assessArticleQualityDimensions(input: {
  title: string;
  metaTitle: string;
  metaDescription: string;
  contentHtml: string;
  primaryKeyword: string;
  evidenceCount: number;
  brandProfileAvailable: boolean;
}): QualityDimensions {
  const body = stripHtml(input.contentHtml);
  const words = body.split(/\s+/).filter(Boolean);
  const lower = body.toLocaleLowerCase();
  const keyword = input.primaryKeyword.trim().toLocaleLowerCase();
  const keywordOccurrences = keyword ? lower.split(keyword).length - 1 : 0;
  const keywordDensity = words.length ? (keywordOccurrences * Math.max(keyword.split(/\s+/).length, 1)) / words.length : 0;
  const headings = (input.contentHtml.match(/<h[2-6][\s>]/gi) ?? []).length;
  const paragraphs = [...input.contentHtml.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)].map((match) => stripHtml(match[1]).toLocaleLowerCase()).filter((value) => value.split(/\s+/).length >= 15);
  const repeatedParagraphs = paragraphs.length - new Set(paragraphs).size;
  const sentences = body.split(/[.!?]+/).map((value) => value.trim()).filter(Boolean);
  const averageSentenceWords = sentences.length ? words.length / sentences.length : words.length;
  const externalLinks = (input.contentHtml.match(/<a\s[^>]*href=["']https?:\/\//gi) ?? []).length;
  const riskyFactClaims = (body.match(/\b\d+(?:[.,]\d+)?\s*%|studies show|research shows|according to|исследован\w* показыва|по данным|uuringud näitavad/gi) ?? []).length;
  const criticalFlags: string[] = [];
  if (/<script\b/i.test(input.contentHtml) || /(?:href|src)=["']\s*javascript:/i.test(input.contentHtml)) criticalFlags.push("unsafe_html");
  if (keywordDensity > 0.04) criticalFlags.push("keyword_stuffing");
  if (repeatedParagraphs > 0) criticalFlags.push("repeated_paragraphs");

  const contentQuality = clamp(55 + Math.min(words.length / 20, 35) + Math.min(headings * 3, 10) - repeatedParagraphs * 20);
  const seo = clamp(45 + (input.metaTitle.trim() ? 15 : 0) + (input.metaDescription.trim() ? 15 : 0) + (keyword && `${input.title} ${body}`.toLocaleLowerCase().includes(keyword) ? 15 : 0) + Math.min(headings * 2, 10) - (keywordDensity > 0.04 ? 35 : 0));
  const brandMatch = clamp((input.brandProfileAvailable ? 75 : 55) + (/contact|order|заказ|связ|telli/i.test(body) ? 15 : 0));
  const factualConfidence = clamp(90 + Math.min(input.evidenceCount * 2, 10) - Math.max(0, riskyFactClaims - externalLinks) * 25);
  const readability = clamp(100 - Math.max(0, averageSentenceWords - 24) * 3);
  const commercialRelevance = clamp(55 + (/contact|order|buy|book|заказ|купить|связ|telli|osta/i.test(body) ? 30 : 0) + (keyword && lower.includes(keyword) ? 10 : 0));
  const overall = clamp(
    contentQuality * 0.24 +
      seo * 0.2 +
      brandMatch * 0.14 +
      factualConfidence * 0.2 +
      readability * 0.1 +
      commercialRelevance * 0.12 -
      criticalFlags.length * 15
  );
  return { contentQuality, seo, brandMatch, factualConfidence, readability, commercialRelevance, overall, criticalFlags };
}
