import type { AutopilotStrategySnapshot } from "./strategy-snapshot";

export type CommunityVisibilityChannel = "REDDIT" | "QUORA" | "NICHE_FORUMS";

export type CommunityVisibilityOpportunity = {
  id: string;
  channel: CommunityVisibilityChannel;
  query: string;
  searchUrl: string;
  angle: string;
};

export type CommunityVisibilitySnapshot = {
  opportunities: CommunityVisibilityOpportunity[];
  sourceTopics: string[];
  sourceKeywords: string[];
  hasEnoughSignal: boolean;
};

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueFirst(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = normalize(value);
    const key = cleaned.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= limit) break;
  }
  return result;
}

function primaryTerms(snapshot: AutopilotStrategySnapshot): string[] {
  return uniqueFirst(
    [
      ...snapshot.keywords,
      ...snapshot.articleTitles.map((title) =>
        title
          .replace(/^(complete guide|полное руководство|täielik juhend):\s*/i, "")
          .replace(/^(where to order|где заказать|kust tellida)\s+/i, "")
          .replace(/:.*$/, "")
      ),
    ],
    4
  );
}

export function buildCommunitySearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function buildCommunityVisibilitySnapshot(
  snapshot: AutopilotStrategySnapshot | null | undefined
): CommunityVisibilitySnapshot | null {
  if (!snapshot || snapshot.articleCount === 0) return null;

  const terms = primaryTerms(snapshot);
  if (terms.length === 0) return null;

  const opportunities: CommunityVisibilityOpportunity[] = [];
  for (const term of terms.slice(0, 3)) {
    opportunities.push(
      {
        id: `reddit:${term}`,
        channel: "REDDIT",
        query: `site:reddit.com "${term}" OR "${term} reddit"`,
        searchUrl: buildCommunitySearchUrl(
          `site:reddit.com "${term}" OR "${term} reddit"`
        ),
        angle:
          "Find discussion threads where people compare options, then answer with a helpful summary and link only when it genuinely helps.",
      },
      {
        id: `quora:${term}`,
        channel: "QUORA",
        query: `site:quora.com "${term}"`,
        searchUrl: buildCommunitySearchUrl(`site:quora.com "${term}"`),
        angle:
          "Look for buyer questions and turn the approved article into a short, non-promotional expert answer.",
      },
      {
        id: `forums:${term}`,
        channel: "NICHE_FORUMS",
        query: `"${term}" forum OR discussion OR community`,
        searchUrl: buildCommunitySearchUrl(
          `"${term}" forum OR discussion OR community`
        ),
        angle:
          "Find niche communities and use the article as a source for a useful answer, not a copied sales pitch.",
      }
    );
  }

  return {
    opportunities: opportunities.slice(0, 6),
    sourceTopics: snapshot.articleTitles.slice(0, 3),
    sourceKeywords: terms,
    hasEnoughSignal: snapshot.hasResearch || snapshot.keywords.length > 0,
  };
}
