import type {
  AutopilotPlanItem,
  AutopilotPlanItemsDocument,
} from "./plan-item-types";

export type AutopilotStrategySnapshot = {
  articleCount: number;
  fixCount: number;
  keywords: string[];
  competitors: string[];
  geoPrompts: string[];
  articleTitles: string[];
  hasResearch: boolean;
};

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function collectArticleResearch(item: AutopilotPlanItem, snapshot: AutopilotStrategySnapshot) {
  const brief = item.researchBrief;
  if (!brief || typeof brief !== "object" || Array.isArray(brief)) return;
  const record = brief as Record<string, unknown>;
  snapshot.hasResearch = true;

  const primaryKeyword = stringValue(record.primaryKeyword);
  if (primaryKeyword) snapshot.keywords.push(primaryKeyword);

  const secondary = record.secondaryKeywords;
  if (Array.isArray(secondary)) {
    for (const keyword of secondary) {
      const value = stringValue(keyword);
      if (value) snapshot.keywords.push(value);
    }
  }

  const competitors = record.competitors;
  if (Array.isArray(competitors)) {
    for (const competitor of competitors) {
      if (typeof competitor === "string") {
        const value = stringValue(competitor);
        if (value) snapshot.competitors.push(value);
        continue;
      }
      if (competitor && typeof competitor === "object") {
        const c = competitor as Record<string, unknown>;
        const value =
          stringValue(c.domain) ??
          stringValue(c.url) ??
          stringValue(c.name) ??
          stringValue(c.title);
        if (value) snapshot.competitors.push(value);
      }
    }
  }

  const prompts = record.geoPrompts;
  if (Array.isArray(prompts)) {
    for (const prompt of prompts) {
      if (typeof prompt === "string") {
        const value = stringValue(prompt);
        if (value) snapshot.geoPrompts.push(value);
        continue;
      }
      if (prompt && typeof prompt === "object") {
        const value = stringValue((prompt as Record<string, unknown>).prompt);
        if (value) snapshot.geoPrompts.push(value);
      }
    }
  }
}

function uniqueFirst(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value.trim());
    if (result.length >= limit) break;
  }
  return result;
}

export function buildAutopilotStrategySnapshot(
  document: AutopilotPlanItemsDocument | null | undefined
): AutopilotStrategySnapshot | null {
  if (!document?.items.length) return null;

  const snapshot: AutopilotStrategySnapshot = {
    articleCount: 0,
    fixCount: 0,
    keywords: [],
    competitors: [],
    geoPrompts: [],
    articleTitles: [],
    hasResearch: false,
  };

  for (const item of document.items) {
    if (item.type === "ARTICLE") {
      snapshot.articleCount += 1;
      snapshot.articleTitles.push(item.title);
      collectArticleResearch(item, snapshot);
    } else if (item.type === "SEO_FIX" || item.type === "TASK_FIX") {
      snapshot.fixCount += 1;
    }
  }

  snapshot.keywords = uniqueFirst(snapshot.keywords, 6);
  snapshot.competitors = uniqueFirst(snapshot.competitors, 5);
  snapshot.geoPrompts = uniqueFirst(snapshot.geoPrompts, 3);
  snapshot.articleTitles = uniqueFirst(snapshot.articleTitles, 5);

  return snapshot.articleCount > 0 || snapshot.fixCount > 0 ? snapshot : null;
}
