import { repairArticleDraft } from "./client";
import type { HermesArticleDraftResult } from "./types";

export type ArticleQualityIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type ArticleQualityValidationResult = {
  score: number;
  issues: ArticleQualityIssue[];
  passed: boolean;
};

export type ArticleQualityIssueItem = {
  code: string;
  message: string;
  status: "open" | "fixed" | "warning";
  displayLabel: string;
};

export type ArticleQualityIssuesSnapshot = {
  score: number;
  passed: boolean;
  items: ArticleQualityIssueItem[];
  repairAttempts: number;
  validatedAt: string;
};

export type ArticleQualityPipelineResult = {
  article: HermesArticleDraftResult;
  qualityScore: number;
  qualityPassed: boolean;
  qualityIssuesJson: ArticleQualityIssuesSnapshot;
  repairAttempts: number;
  repairUsages: Array<{
    costCents: number;
    provider: string;
    model: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
  }>;
};

export const QUALITY_PASS_THRESHOLD = 80;
export const MAX_QUALITY_REPAIR_ATTEMPTS = 2;

// NOTE: JavaScript's \b only recognizes ASCII word chars, so \b around
// Cyrillic/Estonian words never matches. Cyrillic/Estonian CTA terms therefore
// use plain substring patterns (case-insensitive).
const CTA_PATTERNS = [
  /\bcontact us\b/i,
  /\bget in touch\b/i,
  /\bcall us\b/i,
  /\blearn more\b/i,
  /\bbook a\b/i,
  /заказать/i,
  /оформить заказ/i,
  /связаться/i,
  /свяжитесь/i,
  /узнать больше/i,
  /запишитесь/i,
  /оставить заявку/i,
  /telli(?:da|ge)?/i,
  /võ(?:t|ta) meiega ühendust/i,
  /\bcta\b/i,
  /class=["'][^"']*btn/i,
  /<a[^>]+href=["'][^"']+["'][^>]*>[^<]{0,40}(contact|связ|заказ|узнать|запис|telli)/i,
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
  if (!normalized) {
    return 0;
  }
  return normalized.split(/\s+/).filter(Boolean).length;
}

function countH2Tags(contentHtml: string): number {
  return (contentHtml.match(/<h2[\s>]/gi) ?? []).length;
}

function countFaqItems(faqJson: unknown): number {
  if (!faqJson) {
    return 0;
  }

  if (Array.isArray(faqJson)) {
    return faqJson.length;
  }

  if (typeof faqJson === "object") {
    const record = faqJson as Record<string, unknown>;
    if (Array.isArray(record.items)) {
      return record.items.length;
    }
    if (Array.isArray(record.questions)) {
      return record.questions.length;
    }
  }

  return 0;
}

function hasSchema(schemaJson: unknown): boolean {
  if (!schemaJson || typeof schemaJson !== "object") {
    return false;
  }

  return Object.keys(schemaJson as Record<string, unknown>).length > 0;
}

function hasCta(contentHtml: string): boolean {
  return CTA_PATTERNS.some((pattern) => pattern.test(contentHtml));
}

function countKeywordOccurrences(text: string, keyword: string): number {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.match(new RegExp(escaped, "gi"));
  return matches?.length ?? 0;
}

function pushIssue(
  issues: ArticleQualityIssue[],
  code: string,
  message: string,
  severity: "error" | "warning" = "error"
) {
  issues.push({ code, message, severity });
}

/**
 * Rule-based validator for Hermes-generated articles (no AI).
 */
export function validateGeneratedArticle(
  article: HermesArticleDraftResult,
  targetKeyword?: string | null
): ArticleQualityValidationResult {
  const issues: ArticleQualityIssue[] = [];

  const title = article.title?.trim() ?? "";
  if (!title) {
    pushIssue(issues, "title_empty", "Title не может быть пустым.");
  } else if (title.length < 30 || title.length > 70) {
    pushIssue(
      issues,
      "title_length",
      `Title должен быть 30–70 символов (сейчас ${title.length}).`
    );
  }

  const metaTitle = article.metaTitle?.trim() ?? "";
  if (metaTitle.length < 30 || metaTitle.length > 60) {
    pushIssue(
      issues,
      "meta_title_length",
      `Meta Title должен быть 30–60 символов (сейчас ${metaTitle.length}).`
    );
  }

  const metaDescription = article.metaDescription?.trim() ?? "";
  if (metaDescription.length < 110 || metaDescription.length > 160) {
    pushIssue(
      issues,
      "meta_description_length",
      `Meta Description должна быть 110–160 символов (сейчас ${metaDescription.length}).`
    );
  }

  const wordCount = countWords(article.contentHtml ?? "");
  if (wordCount < 900) {
    pushIssue(
      issues,
      "content_word_count",
      `Контент должен содержать минимум 900 слов (сейчас ${wordCount}).`
    );
  }

  const h2Count = countH2Tags(article.contentHtml ?? "");
  if (h2Count < 3) {
    pushIssue(
      issues,
      "h2_count",
      `Нужно минимум 3 подзаголовка H2 (сейчас ${h2Count}).`
    );
  }

  const faqCount = countFaqItems(article.faqJson);
  if (faqCount < 3) {
    pushIssue(
      issues,
      "faq_count",
      `FAQ должен содержать минимум 3 вопроса (сейчас ${faqCount}).`
    );
  }

  const slug = article.slug?.trim() ?? "";
  if (!slug) {
    pushIssue(issues, "slug_empty", "Slug не может быть пустым.");
  }

  if (!hasSchema(article.schemaJson)) {
    pushIssue(issues, "schema_missing", "Schema JSON отсутствует.");
  }

  if (!hasCta(article.contentHtml ?? "")) {
    pushIssue(issues, "cta_missing", "Не найден призыв к действию (CTA).");
  }

  const keyword = targetKeyword?.trim();
  if (keyword) {
    const searchable = [
      article.title,
      article.metaTitle,
      article.metaDescription,
      stripHtml(article.contentHtml ?? ""),
    ].join(" ");
    const keywordCount = countKeywordOccurrences(searchable, keyword);
    if (keywordCount < 3) {
      pushIssue(
        issues,
        "keyword_density",
        `Target keyword «${keyword}» должен встретиться минимум 3 раза (сейчас ${keywordCount}).`,
        "warning"
      );
    }
  }

  const penalty = issues.reduce(
    (sum, issue) => sum + (issue.severity === "warning" ? 5 : 10),
    0
  );
  const score = Math.max(0, 100 - penalty);

  return {
    score,
    issues,
    passed: issues.filter((issue) => issue.severity === "error").length === 0,
  };
}

const ISSUE_LABELS: Record<string, string> = {
  title_empty: "Title",
  title_length: "Title",
  meta_title_length: "Meta Title",
  meta_description_length: "Meta Description",
  content_word_count: "Объём контента",
  h2_count: "Подзаголовки H2",
  faq_count: "FAQ",
  slug_empty: "Slug",
  schema_missing: "Schema",
  cta_missing: "CTA",
  keyword_density: "Keyword",
};

function buildRepairInstructions(issues: ArticleQualityIssue[]): string {
  const lines = issues.map((issue) => `— ${issue.message}`);
  return [
    "Исправь:",
    ...lines,
    "Не меняй общий смысл статьи.",
  ].join("\n");
}

/**
 * Sends repair instructions to Hermes without rewriting from scratch.
 */
export async function repairGeneratedArticle(
  article: HermesArticleDraftResult,
  issues: ArticleQualityIssue[],
  context: {
    website: { url: string; niche: string | null; language: string };
    targetKeyword: string | null;
    topic: string;
  }
): Promise<HermesArticleDraftResult> {
  return repairArticleDraft({
    website: context.website,
    article: {
      topic: context.topic,
      targetKeyword: context.targetKeyword,
      language: context.website.language,
    },
    currentDraft: article,
    repairInstructions: buildRepairInstructions(issues),
    issues: issues.map((issue) => issue.message),
  });
}

function buildQualitySnapshot(
  validation: ArticleQualityValidationResult,
  previousIssues: ArticleQualityIssue[],
  repairAttempts: number
): ArticleQualityIssuesSnapshot {
  const previousCodes = new Set(previousIssues.map((issue) => issue.code));
  const currentCodes = new Set(validation.issues.map((issue) => issue.code));

  const fixedItems: ArticleQualityIssueItem[] = [...previousCodes]
    .filter((code) => !currentCodes.has(code))
    .map((code) => ({
      code,
      message: ISSUE_LABELS[code] ?? code,
      status: "fixed" as const,
      displayLabel: `${ISSUE_LABELS[code] ?? code} исправлен`,
    }));

  const openItems: ArticleQualityIssueItem[] = validation.issues.map(
    (issue) => ({
      code: issue.code,
      message: issue.message,
      status: issue.severity === "warning" ? "warning" : "open",
      displayLabel: issue.message,
    })
  );

  return {
    score: validation.score,
    passed: validation.score >= QUALITY_PASS_THRESHOLD,
    items: [...fixedItems, ...openItems],
    repairAttempts,
    validatedAt: new Date().toISOString(),
  };
}

/**
 * Runs generate → validate → repair (max 2) → validate pipeline synchronously.
 */
export async function runArticleQualityPipeline({
  article,
  targetKeyword,
  topic,
  website,
}: {
  article: HermesArticleDraftResult;
  targetKeyword: string | null;
  topic: string;
  website: { url: string; niche: string | null; language: string };
}): Promise<ArticleQualityPipelineResult> {
  let currentArticle = article;
  let repairAttempts = 0;
  let validation = validateGeneratedArticle(currentArticle, targetKeyword);
  let previousIssues: ArticleQualityIssue[] = [];
  const repairUsages: ArticleQualityPipelineResult["repairUsages"] = [];

  if (!validation.passed) {
    previousIssues = [...validation.issues];

    while (
      repairAttempts < MAX_QUALITY_REPAIR_ATTEMPTS &&
      !validation.passed
    ) {
      const repaired = await repairGeneratedArticle(
        currentArticle,
        validation.issues,
        {
          website,
          targetKeyword,
          topic,
        }
      );

      repairAttempts += 1;
      currentArticle = repaired;

      if (repaired.metadata) {
        repairUsages.push({
          costCents: repaired.metadata.costCents ?? 0,
          provider: repaired.metadata.provider ?? "hermes",
          model: repaired.metadata.model ?? "unknown",
          inputTokens: repaired.metadata.inputTokens ?? null,
          outputTokens: repaired.metadata.outputTokens ?? null,
          totalTokens: repaired.metadata.totalTokens ?? null,
        });
      } else {
        repairUsages.push({
          costCents: 0,
          provider: "hermes",
          model: "unknown",
        });
      }

      const nextValidation = validateGeneratedArticle(
        currentArticle,
        targetKeyword
      );
      previousIssues = [...validation.issues];
      validation = nextValidation;
    }
  }

  const qualityPassed = validation.score >= QUALITY_PASS_THRESHOLD;

  return {
    article: currentArticle,
    qualityScore: validation.score,
    qualityPassed,
    qualityIssuesJson: buildQualitySnapshot(
      validation,
      previousIssues,
      repairAttempts
    ),
    repairAttempts,
    repairUsages,
  };
}
