import type { SearchIntent } from "./types";
import { classifySearchIntent } from "./intent";
import {
  dedupeKeywords,
  extractKeywordCandidates as extractKeywordsFromText,
  normalizeKeyword,
} from "./normalize";

export type KeywordCandidate = {
  keyword: string;
  normalized: string;
  source: "TASK" | "ARTICLE" | "GSC" | "AUDIT" | "OPPORTUNITY" | "PLAN_ITEM" | "MANUAL";
  sourceLabel: string;
  searchIntent: SearchIntent;
  geoRelevant: boolean;
};

export type KeywordExtractionInput = {
  planItemTitle?: string;
  planItemReason?: string;
  manualKeyword?: string;
  manualTopic?: string;
  article?: { title?: string; topic?: string | null; targetKeyword?: string | null };
  task?: { title?: string; description?: string | null };
  opportunities?: Array<{ title: string; description: string; type: string }>;
  auditFindings?: Array<{ title: string }>;
  gscInsightTitles?: string[];
  focusAreaTitles?: string[];
  niche?: string | null;
  isLocalBusiness?: boolean;
};

const AUDIT_SYMPTOM_PATTERNS = [
  /\b(on\s+page|page|content|text)\b.*\b(too\s+little|too\s+thin|thin|low|missing|not\s+enough)\b/i,
  /\b(missing|duplicate|too\s+long|too\s+short|low|thin)\b.*\b(title|h1|meta|description|content|text|schema|alt|canonical)\b/i,
  /\b(no|missing)\b.*\b(index|indexed|h1|title|meta|schema|alt|canonical|viewport)\b/i,
  /(страниц[аеуы]?|контент[ае]?|текст[ае]?).*(слишком\s+мало|маловато|тонк|недостаточно|отсутствует|нет)/i,
  /(отсутствует|нет|слишком\s+длинн|слишком\s+коротк|дублиру).*(title|h1|meta|description|описани|заголов|schema|canonical)/i,
  /(lehel|sisu|tekst).*(liiga\s+vähe|õhuke|puudu|madal)/i,
  /(puudu|liiga\s+pikk|liiga\s+lühike|duplikaat).*(title|h1|meta|kirjeldus|schema|canonical)/i,
];

const TECHNICAL_INSTRUCTION_PATTERNS = [
  /\b(add|create|update|improve|fix|prepare|continue|finish)\b.*\b(description|service|services|benefits|faq|call\s+to\s+action|cta|title|meta|h1|schema|content|page)\b/i,
  /\b(high-priority|growth audit|seo task|audit finding|plan item|review queue)\b/i,
  /(добавьте|создайте|обновите|улучшите|исправьте|подготовьте).*(описани|услуг|преимуществ|faq|призыв|действи|заголов|meta|h1|schema|контент|страниц)/i,
  /(приоритетн|задач[аиу]?|аудит[ае]?|очередь\s+проверки|план\s+автопилота)/i,
  /(lisage|looge|uuendage|parandage).*(kirjeldus|teenus|eelis|faq|cta|title|meta|h1|schema|sisu|leht)/i,
];

function isAuditSymptomPhrase(value: string): boolean {
  const normalized = normalizeKeyword(value);
  if (!normalized) {
    return false;
  }

  return AUDIT_SYMPTOM_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isTechnicalInstructionPhrase(value: string): boolean {
  const normalized = normalizeKeyword(value);
  if (!normalized) {
    return false;
  }

  return TECHNICAL_INSTRUCTION_PATTERNS.some((pattern) =>
    pattern.test(normalized)
  );
}

function isUnsafeAutopilotKeyword(value: string): boolean {
  return isAuditSymptomPhrase(value) || isTechnicalInstructionPhrase(value);
}

function toCandidate(
  keyword: string,
  source: KeywordCandidate["source"],
  sourceLabel: string,
  context: { niche?: string | null; isLocalBusiness?: boolean }
): KeywordCandidate {
  const searchIntent = classifySearchIntent(keyword, context);
  return {
    keyword,
    normalized: normalizeKeyword(keyword),
    source,
    sourceLabel,
    searchIntent,
    geoRelevant: ["COMMERCIAL", "COMPARISON", "LOCAL", "TRANSACTIONAL"].includes(
      searchIntent
    ),
  };
}

/**
 * Deterministic keyword extraction from existing data sources.
 */
export function extractKeywordCandidates(
  input: KeywordExtractionInput
): KeywordCandidate[] {
  const context = {
    niche: input.niche,
    isLocalBusiness: input.isLocalBusiness,
  };
  const raw: KeywordCandidate[] = [];

  if (input.manualKeyword?.trim()) {
    raw.push(
      toCandidate(input.manualKeyword.trim(), "MANUAL", "Manual keyword", context)
    );
  }

  if (input.manualTopic?.trim() && input.manualTopic !== input.manualKeyword) {
    for (const kw of extractKeywordsFromText(input.manualTopic)) {
      raw.push(toCandidate(kw, "MANUAL", "Manual topic", context));
    }
  }

  if (input.article?.targetKeyword?.trim()) {
    raw.push(
      toCandidate(
        input.article.targetKeyword.trim(),
        "ARTICLE",
        "Existing article keyword",
        context
      )
    );
  }

  if (input.article?.topic?.trim()) {
    for (const kw of extractKeywordsFromText(input.article.topic)) {
      raw.push(toCandidate(kw, "ARTICLE", "Article topic", context));
    }
  }

  if (input.task?.title) {
    for (const kw of extractKeywordsFromText(input.task.title)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        raw.push(toCandidate(kw, "TASK", "SEO task", context));
      }
    }
  }

  if (input.task?.description) {
    for (const kw of extractKeywordsFromText(input.task.description)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        raw.push(toCandidate(kw, "TASK", "Task description", context));
      }
    }
  }

  if (input.planItemTitle) {
    for (const kw of extractKeywordsFromText(input.planItemTitle)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        raw.push(toCandidate(kw, "PLAN_ITEM", "Autopilot plan item", context));
      }
    }
  }

  if (input.planItemReason) {
    for (const kw of extractKeywordsFromText(input.planItemReason)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        raw.push(toCandidate(kw, "PLAN_ITEM", "Plan item reason", context));
      }
    }
  }

  for (const opp of input.opportunities ?? []) {
    if (opp.type === "CONTENT" || opp.type === "GSC") {
      for (const kw of extractKeywordsFromText(opp.description)) {
        raw.push(toCandidate(kw, "OPPORTUNITY", opp.title, context));
      }
    }
  }

  for (const finding of input.auditFindings ?? []) {
    for (const kw of extractKeywordsFromText(finding.title)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        raw.push(toCandidate(kw, "AUDIT", "Audit finding", context));
      }
    }
  }

  for (const title of input.gscInsightTitles ?? []) {
    for (const kw of extractKeywordsFromText(title)) {
      raw.push(toCandidate(kw, "GSC", "Search Console insight", context));
    }
  }

  for (const title of input.focusAreaTitles ?? []) {
    for (const kw of extractKeywordsFromText(title)) {
      raw.push(toCandidate(kw, "PLAN_ITEM", "Plan focus area", context));
    }
  }

  const seen = new Set<string>();
  const deduped: KeywordCandidate[] = [];

  for (const candidate of raw) {
    if (!candidate.normalized || seen.has(candidate.normalized)) {
      continue;
    }
    seen.add(candidate.normalized);
    deduped.push(candidate);
  }

  return deduped;
}

export const __contentResearchKeywordInternals = {
  isAuditSymptomPhrase,
  isTechnicalInstructionPhrase,
};

export function pickPrimaryKeyword(candidates: KeywordCandidate[]): KeywordCandidate | null {
  if (candidates.length === 0) {
    return null;
  }

  const priority: KeywordCandidate["source"][] = [
    "MANUAL",
    "ARTICLE",
    "TASK",
    "GSC",
    "OPPORTUNITY",
    "PLAN_ITEM",
    "AUDIT",
  ];

  for (const source of priority) {
    const match = candidates.find((c) => c.source === source);
    if (match) {
      return match;
    }
  }

  return candidates[0] ?? null;
}

export function pickSecondaryKeywords(
  candidates: KeywordCandidate[],
  primary: KeywordCandidate,
  limit = 5
): string[] {
  return dedupeKeywords(
    candidates
      .filter((c) => c.normalized !== primary.normalized)
      .map((c) => c.keyword)
  ).slice(0, limit);
}
