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
      raw.push(toCandidate(kw, "TASK", "SEO task", context));
    }
  }

  if (input.task?.description) {
    for (const kw of extractKeywordsFromText(input.task.description)) {
      raw.push(toCandidate(kw, "TASK", "Task description", context));
    }
  }

  if (input.planItemTitle) {
    for (const kw of extractKeywordsFromText(input.planItemTitle)) {
      raw.push(toCandidate(kw, "PLAN_ITEM", "Autopilot plan item", context));
    }
  }

  if (input.planItemReason) {
    for (const kw of extractKeywordsFromText(input.planItemReason)) {
      raw.push(toCandidate(kw, "PLAN_ITEM", "Plan item reason", context));
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
      raw.push(toCandidate(kw, "AUDIT", "Audit finding", context));
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
