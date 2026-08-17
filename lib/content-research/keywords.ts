import type { SearchIntent } from "./types";
import { classifySearchIntent } from "./intent";
import {
  containsDomainToken,
  dedupeKeywords,
  extractKeywordCandidates as extractKeywordsFromText,
  normalizeKeyword,
  removeDomainTokens,
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

const NON_TOPIC_PATTERNS = [
  /^(people|customers|buyers|users|audience)\b.*\b(looking|who|seeking|need)/i,
  /^(люди|клиенты|покупатели|пользователи|аудитория)[\s,]+.*(которые|ищут|желающие|нуждаются)/i,
  /^(inimesed|kliendid|ostjad|kasutajad)[\s,]+.*(kes|otsivad|vajavad)/i,
  /\b(your\s+photos?|pure\s+art|artistic\s+perfection)\b/i,
  /\b\d+\s*(steps?|шага|шагов|sammu)\b/i,
  /^(match site ctas|prefer (shorter|longer) sentences|site copy uses)/i,
];

function isAudienceDescriptionOrSlogan(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return false;
  if (NON_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized))) return true;

  const sentenceFragments = normalized
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return normalized.length <= 80 && sentenceFragments.length > 1;
}

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
  return (
    containsDomainToken(value) ||
    isAuditSymptomPhrase(value) ||
    isTechnicalInstructionPhrase(value) ||
    isAudienceDescriptionOrSlogan(value)
  );
}

function cleanKeywordCandidate(value: string): string | null {
  const cleaned = removeDomainTokens(value)
    .replace(/^(полное\s+руководство|complete\s+guide|täielik\s+juhend)\s*[:—-]?\s*/i, "")
    .replace(/^(где\s+заказать|where\s+to\s+order|kust\s+tellida)\s+/i, "")
    .replace(
      /\s*[:—-]\s*(как выбрать лучший вариант|how to choose the best option|kuidas valida parim lahendus)\.?$/i,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 3) {
    return null;
  }

  if (isUnsafeAutopilotKeyword(cleaned)) {
    return null;
  }

  return cleaned;
}

function toCandidate(
  keyword: string,
  source: KeywordCandidate["source"],
  sourceLabel: string,
  context: { niche?: string | null; isLocalBusiness?: boolean }
): KeywordCandidate {
  const cleaned = cleanKeywordCandidate(keyword) ?? keyword.trim();
  const searchIntent = classifySearchIntent(cleaned, context);
  return {
    keyword: cleaned,
    normalized: normalizeKeyword(cleaned),
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

  function pushCandidate(
    keyword: string,
    source: KeywordCandidate["source"],
    sourceLabel: string
  ) {
    const cleaned = cleanKeywordCandidate(keyword);
    if (cleaned) {
      raw.push(toCandidate(cleaned, source, sourceLabel, context));
    }
  }

  if (input.manualKeyword?.trim()) {
    pushCandidate(input.manualKeyword.trim(), "MANUAL", "Manual keyword");
  }

  if (input.manualTopic?.trim() && input.manualTopic !== input.manualKeyword) {
    for (const kw of extractKeywordsFromText(input.manualTopic)) {
      pushCandidate(kw, "MANUAL", "Manual topic");
    }
  }

  if (input.article?.targetKeyword?.trim()) {
    pushCandidate(
      input.article.targetKeyword.trim(),
      "ARTICLE",
      "Existing article keyword"
    );
  }

  if (input.article?.topic?.trim()) {
    for (const kw of extractKeywordsFromText(input.article.topic)) {
      pushCandidate(kw, "ARTICLE", "Article topic");
    }
  }

  if (input.task?.title) {
    for (const kw of extractKeywordsFromText(input.task.title)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        pushCandidate(kw, "TASK", "SEO task");
      }
    }
  }

  if (input.task?.description) {
    for (const kw of extractKeywordsFromText(input.task.description)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        pushCandidate(kw, "TASK", "Task description");
      }
    }
  }

  if (input.planItemTitle) {
    for (const kw of extractKeywordsFromText(input.planItemTitle)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        pushCandidate(kw, "PLAN_ITEM", "Autopilot plan item");
      }
    }
  }

  if (input.planItemReason) {
    for (const kw of extractKeywordsFromText(input.planItemReason)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        pushCandidate(kw, "PLAN_ITEM", "Plan item reason");
      }
    }
  }

  for (const opp of input.opportunities ?? []) {
    if (opp.type === "CONTENT" || opp.type === "GSC") {
      for (const kw of extractKeywordsFromText(opp.description)) {
        pushCandidate(kw, "OPPORTUNITY", opp.title);
      }
    }
  }

  for (const finding of input.auditFindings ?? []) {
    for (const kw of extractKeywordsFromText(finding.title)) {
      if (!isUnsafeAutopilotKeyword(kw)) {
        pushCandidate(kw, "AUDIT", "Audit finding");
      }
    }
  }

  for (const title of input.gscInsightTitles ?? []) {
    for (const kw of extractKeywordsFromText(title)) {
      pushCandidate(kw, "GSC", "Search Console insight");
    }
  }

  for (const title of input.focusAreaTitles ?? []) {
    for (const kw of extractKeywordsFromText(title)) {
      pushCandidate(kw, "PLAN_ITEM", "Plan focus area");
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
  isAudienceDescriptionOrSlogan,
  isUnsafeAutopilotKeyword,
  cleanKeywordCandidate,
};

/** Audit symptom or technical instruction — not a valid article topic/keyword. */
export function isUnsafeArticleTopic(value: string): boolean {
  return isUnsafeAutopilotKeyword(value);
}

/** Audit codes that describe on-page content gaps, not standalone article topics. */
export function isPageContentFixAuditCode(code: string | null | undefined): boolean {
  if (!code?.trim()) {
    return false;
  }

  const normalized = code.trim().toLowerCase();
  return (
    normalized.startsWith("word_count") || normalized.includes("thin_content")
  );
}

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
