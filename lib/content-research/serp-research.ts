import "server-only";

import { getServerEnv } from "@/lib/env";
import { fetchHtmlPage } from "@/lib/audit/fetch";
import { extractCrawlDocument } from "@/lib/crawler/document";
import type { SerpResearchSnapshot } from "./types";

type SerperResponse = {
  organic?: Array<{ position?: unknown; title?: unknown; link?: unknown; snippet?: unknown }>;
  peopleAlsoAsk?: Array<{ question?: unknown }>;
  relatedSearches?: Array<{ query?: unknown }>;
  knowledgeGraph?: { title?: unknown; type?: unknown; attributes?: unknown };
};

function string(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function researchLiveSerp(input: {
  query: string;
  locale: "en" | "ru" | "et";
}): Promise<SerpResearchSnapshot> {
  const observedAt = new Date().toISOString();
  const apiKey = getServerEnv().SERPER_API_KEY;
  if (!apiKey) {
    return { provider: "SERPER", query: input.query, observedAt, available: false, unavailableReason: "SERPER_API_KEY is not configured.", topPages: [], relatedQuestions: [], commonHeadings: [], entities: [] };
  }
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({ q: input.query, hl: input.locale, num: 10 }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`serper_http_${response.status}`);
    const data = await response.json() as SerperResponse;
    const organic = (data.organic ?? []).flatMap((item, index) => {
      const url = string(item.link);
      const title = string(item.title);
      if (!url || !title) return [];
      return [{ position: typeof item.position === "number" ? item.position : index + 1, title, url, snippet: string(item.snippet), headings: [] as string[] }];
    }).slice(0, 10);
    const inspected = await Promise.allSettled(organic.slice(0, 3).map(async (page) => {
      const fetched = await fetchHtmlPage(page.url, 8_000);
      const document = extractCrawlDocument(fetched.html, fetched.finalUrl);
      return { url: page.url, headings: document.headings.filter((heading) => heading.level <= 3).map((heading) => heading.text).slice(0, 20) };
    }));
    const headingsByUrl = new Map(inspected.flatMap((result) => result.status === "fulfilled" ? [[result.value.url, result.value.headings] as const] : []));
    const topPages = organic.map((page) => ({ ...page, headings: headingsByUrl.get(page.url) ?? [] }));
    const headingFrequency = new Map<string, { label: string; count: number }>();
    for (const heading of topPages.flatMap((page) => page.headings)) {
      const key = heading.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      if (key.length < 4) continue;
      const current = headingFrequency.get(key);
      headingFrequency.set(key, { label: heading, count: (current?.count ?? 0) + 1 });
    }
    const commonHeadings = [...headingFrequency.values()].sort((a, b) => b.count - a.count).slice(0, 12).map((item) => item.label);
    const relatedQuestions = [
      ...(data.peopleAlsoAsk ?? []).map((item) => string(item.question)),
      ...(data.relatedSearches ?? []).map((item) => string(item.query)),
    ].filter(Boolean).slice(0, 12);
    const attributes = data.knowledgeGraph?.attributes && typeof data.knowledgeGraph.attributes === "object"
      ? Object.keys(data.knowledgeGraph.attributes as Record<string, unknown>)
      : [];
    const entities = [string(data.knowledgeGraph?.title), string(data.knowledgeGraph?.type), ...attributes].filter(Boolean).slice(0, 12);
    return { provider: "SERPER", query: input.query, observedAt, available: true, topPages, relatedQuestions, commonHeadings, entities };
  } catch (error) {
    return { provider: "SERPER", query: input.query, observedAt, available: false, unavailableReason: error instanceof Error ? error.message : "SERP provider request failed.", topPages: [], relatedQuestions: [], commonHeadings: [], entities: [] };
  }
}
