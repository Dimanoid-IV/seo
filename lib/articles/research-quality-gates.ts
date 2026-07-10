import type { HermesArticleDraftResult } from "@/lib/hermes/types";
import {
  QUALITY_PASS_THRESHOLD,
  validateGeneratedArticle,
  type ArticleQualityIssue,
} from "@/lib/hermes/article-quality";
import type { ContentResearchBrief } from "@/lib/content-research/types";

import {
  RESEARCH_QUALITY_PASS_THRESHOLD,
  type ArticleQualityCheck,
  type ArticleQualityReport,
} from "./research-generation-types";

const FAKE_GUARANTEE_PATTERNS = [
  /\bguaranteed?\s+(rank|ranking|results?|traffic|position)/i,
  /\b#1\s+on\s+google\b/i,
  /\b100%\s+(success|guarantee)/i,
  /\bгарантир(ован|уем)/i,
  /\bпервое\s+место\s+в\s+google/i,
  /\b100\s*%\s*результат/i,
  /\bgaranteeritud\b/i,
  /\besimese\s+koha\b/i,
];

const AI_PHRASE_PATTERNS = [
  /\bas an ai\b/i,
  /\bas a language model\b/i,
  /\bi('m| am) an ai\b/i,
  /\bкак искусственный интеллект\b/i,
  /\bя — (ии|ai)\b/i,
  /\btehisintellektina\b/i,
];

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  const normalized = stripHtml(text);
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

function countH2Tags(contentHtml: string): number {
  return (contentHtml.match(/<h2[\s>]/gi) ?? []).length;
}

function countFaqItems(faqJson: unknown, briefFaq: string[]): number {
  if (Array.isArray(faqJson) && faqJson.length > 0) {
    return faqJson.length;
  }
  if (faqJson && typeof faqJson === "object") {
    const record = faqJson as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items.length;
    if (Array.isArray(record.questions)) return record.questions.length;
  }
  return briefFaq.length;
}

function hasSchema(schemaJson: unknown, schemaSuggestions: string[]): boolean {
  if (schemaJson && typeof schemaJson === "object") {
    if (Object.keys(schemaJson as Record<string, unknown>).length > 0) {
      return true;
    }
  }
  return schemaSuggestions.length > 0;
}

function textIncludesKeyword(text: string, keyword: string): boolean {
  if (!keyword.trim()) return true;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i").test(text);
}

function referencesBuyerQuestion(text: string, question: string): boolean {
  if (!question.trim() || question.length < 8) return true;
  const words = question
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 4);
  const lower = text.toLowerCase();
  const matches = words.filter((w) => lower.includes(w)).length;
  return matches >= Math.min(2, words.length);
}

function referencesGeoAngle(text: string, brief: ContentResearchBrief): boolean {
  if (brief.geoPrompts.length === 0) return true;
  const lower = text.toLowerCase();
  return brief.geoPrompts.some((gp) => {
    const promptWords = gp.prompt
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 5)
      .slice(0, 3);
    return promptWords.some((w) => lower.includes(w));
  });
}

function hasFakeGuarantees(text: string): boolean {
  return FAKE_GUARANTEE_PATTERNS.some((p) => p.test(text));
}

function hasAiPhrases(text: string): boolean {
  return AI_PHRASE_PATTERNS.some((p) => p.test(text));
}

function toCheck(
  key: string,
  label: string,
  passed: boolean,
  severity: ArticleQualityCheck["severity"],
  message: string
): ArticleQualityCheck {
  return { key, label, passed, severity, message };
}

/**
 * Research-aware quality gates extending the base Hermes validator.
 */
export function validateResearchAwareArticle(
  article: HermesArticleDraftResult,
  context: {
    targetKeyword: string | null;
    brief: ContentResearchBrief;
    evidenceNotesCount: number;
  }
): ArticleQualityReport {
  const baseValidation = validateGeneratedArticle(
    article,
    context.targetKeyword
  );
  const checks: ArticleQualityCheck[] = [];
  const revisionNotes: string[] = [];

  const searchable = [
    article.title,
    article.metaTitle,
    article.metaDescription,
    stripHtml(article.contentHtml ?? ""),
  ].join(" ");

  const title = article.title?.trim() ?? "";
  checks.push(
    toCheck(
      "has_title",
      "Title",
      Boolean(title),
      "error",
      title ? "Title present." : "Title is missing."
    )
  );

  const hasMeta =
    Boolean(article.metaTitle?.trim()) &&
    Boolean(article.metaDescription?.trim());
  checks.push(
    toCheck(
      "has_meta",
      "Meta title & description",
      hasMeta,
      "error",
      hasMeta
        ? "Meta title and description present."
        : "Meta title or description is missing."
    )
  );

  const keyword = context.targetKeyword?.trim() ?? context.brief.primaryKeyword;
  const hasKeyword = textIncludesKeyword(searchable, keyword);
  checks.push(
    toCheck(
      "has_primary_keyword",
      "Primary keyword",
      hasKeyword,
      hasKeyword ? "info" : "warning",
      hasKeyword
        ? `Primary keyword "${keyword}" used naturally.`
        : `Primary keyword "${keyword}" not found in content.`
    )
  );

  const h2Count = countH2Tags(article.contentHtml ?? "");
  const outlineOk =
    h2Count >= 3 ||
    (context.brief.outline.length >= 3 && h2Count >= 2);
  checks.push(
    toCheck(
      "has_outline_sections",
      "Outline / headings",
      outlineOk,
      "error",
      outlineOk
        ? `${h2Count} section headings found.`
        : `Need at least 3 H2 headings (found ${h2Count}).`
    )
  );

  const faqCount = countFaqItems(article.faqJson, context.brief.faq);
  const faqOk = faqCount >= 3 || context.brief.faq.length >= 3;
  checks.push(
    toCheck(
      "has_faq",
      "FAQ section",
      faqOk,
      "error",
      faqOk
        ? `FAQ present (${faqCount} items).`
        : `FAQ needs at least 3 questions (found ${faqCount}).`
    )
  );

  const noGuarantees = !hasFakeGuarantees(searchable);
  checks.push(
    toCheck(
      "no_fake_guarantees",
      "No ranking guarantees",
      noGuarantees,
      "error",
      noGuarantees
        ? "No fake ranking guarantees detected."
        : "Remove guaranteed ranking or traffic claims."
    )
  );

  const noAi = !hasAiPhrases(searchable);
  checks.push(
    toCheck(
      "no_ai_phrases",
      "No generic AI phrases",
      noAi,
      "error",
      noAi
        ? "No generic AI assistant phrasing detected."
        : 'Remove "as an AI" or similar generic phrasing.'
    )
  );

  const wordCount = countWords(article.contentHtml ?? "");
  const minLengthOk = wordCount >= 700;
  checks.push(
    toCheck(
      "min_length",
      "Minimum length",
      minLengthOk,
      "error",
      minLengthOk
        ? `Content has ${wordCount} words.`
        : `Content needs at least 700 words (found ${wordCount}).`
    )
  );

  const schemaOk = hasSchema(
    article.schemaJson,
    context.brief.schemaSuggestions
  );
  checks.push(
    toCheck(
      "has_schema",
      "Schema suggestions",
      schemaOk,
      "warning",
      schemaOk
        ? "Schema markup or suggestions preserved."
        : "Schema JSON or suggestions missing."
    )
  );

  const geoOk = referencesGeoAngle(searchable, context.brief);
  checks.push(
    toCheck(
      "has_geo_angle",
      "GEO / AI-search angle",
      geoOk,
      "warning",
      geoOk
        ? "GEO prompts referenced in content."
        : "Content should reference GEO / AI-search angles from research."
    )
  );

  const buyerOk = referencesBuyerQuestion(
    searchable,
    context.brief.buyerQuestion
  );
  checks.push(
    toCheck(
      "has_buyer_question",
      "Buyer question",
      buyerOk,
      "warning",
      buyerOk
        ? "Buyer question referenced in content."
        : "Content should address the buyer question from research."
    )
  );

  const evidenceOk = context.evidenceNotesCount > 0;
  checks.push(
    toCheck(
      "has_evidence_notes",
      "Source evidence (internal)",
      evidenceOk,
      "info",
      evidenceOk
        ? `${context.evidenceNotesCount} evidence notes stored internally.`
        : "No source evidence notes from research brief."
    )
  );

  for (const issue of baseValidation.issues) {
    const existing = checks.find((c) => c.key === issue.code);
    if (!existing) {
      checks.push(
        toCheck(
          issue.code,
          issue.code,
          false,
          issue.severity,
          issue.message
        )
      );
    }
  }

  const errorCount = checks.filter(
    (c) => !c.passed && c.severity === "error"
  ).length;
  const warningCount = checks.filter(
    (c) => !c.passed && c.severity === "warning"
  ).length;

  const penalty = errorCount * 10 + warningCount * 5;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  for (const check of checks.filter((c) => !c.passed)) {
    revisionNotes.push(check.message);
  }

  const passed = score >= RESEARCH_QUALITY_PASS_THRESHOLD && errorCount === 0;

  return {
    score,
    passed,
    checks,
    revisionNotes,
    validatedAt: new Date().toISOString(),
    threshold: RESEARCH_QUALITY_PASS_THRESHOLD,
  };
}

export function qualityReportToIssuesSnapshot(
  report: ArticleQualityReport,
  repairAttempts: number
) {
  return {
    score: report.score,
    passed: report.passed,
    items: report.checks.map((check) => ({
      code: check.key,
      message: check.message,
      status: check.passed
        ? ("fixed" as const)
        : check.severity === "warning"
          ? ("warning" as const)
          : ("open" as const),
      displayLabel: check.passed ? `${check.label} ✓` : check.message,
    })),
    repairAttempts,
    validatedAt: report.validatedAt,
    revisionNotes: report.revisionNotes,
    threshold: report.threshold,
  };
}

export function mapIssuesToQualityReport(
  issues: ArticleQualityIssue[],
  score: number,
  passed: boolean
): ArticleQualityReport {
  return {
    score,
    passed,
    checks: issues.map((issue) => ({
      key: issue.code,
      label: issue.code,
      passed: false,
      severity: issue.severity,
      message: issue.message,
    })),
    revisionNotes: issues.map((i) => i.message),
    validatedAt: new Date().toISOString(),
    threshold: QUALITY_PASS_THRESHOLD,
  };
}
