import { readBrandVoiceFromBusinessGoals } from "@/lib/brand-voice/business-goals";
import { classifySearchIntent, keywordToBuyerQuestion } from "@/lib/content-research/intent";
import { isUnsafeArticleTopic } from "@/lib/content-research/keywords";
import { dedupeKeywords, extractKeywordCandidates, normalizeKeyword } from "@/lib/content-research/normalize";

import type { MonthlyAutopilotSourceData } from "./source-data";
import type { AutopilotPlanItem } from "./plan-item-types";

type StrategicArticleOpportunity = {
  keyword: string;
  title: string;
  reason: string;
  priority: "low" | "medium" | "high";
};

function localeFromLanguage(language: string): "en" | "ru" | "et" {
  const upper = language.toUpperCase();
  if (upper === "EN") return "en";
  if (upper === "ET") return "et";
  return "ru";
}

function readableBusinessName(data: MonthlyAutopilotSourceData): string {
  const host = (() => {
    try {
      return new URL(data.website.url).hostname.replace(/^www\./, "");
    } catch {
      return data.website.url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    }
  })();
  return data.website.displayName?.trim() || data.website.niche?.trim() || host;
}

function normalizeSeed(value: string): string | null {
  const cleaned = value
    .replace(/^(review|continue|finish|create|создать|продолжить|jätkake):\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 4 || cleaned.length > 90) return null;
  if (isUnsafeArticleTopic(cleaned)) return null;
  return cleaned;
}

function collectSeedKeywords(data: MonthlyAutopilotSourceData): string[] {
  const brandVoice = readBrandVoiceFromBusinessGoals(data.website.businessGoals);
  const seeds: string[] = [];

  for (const value of [
    data.website.niche,
    data.website.displayName,
    brandVoice?.audience,
    brandVoice?.ctaStyle,
    brandVoice?.manualNotes,
    ...(brandVoice?.commonPhrases ?? []),
  ]) {
    if (typeof value === "string") {
      seeds.push(...extractKeywordCandidates(value));
    }
  }

  for (const opportunity of data.opportunities) {
    if (opportunity.type === "CONTENT" || opportunity.type === "GSC") {
      seeds.push(...extractKeywordCandidates(opportunity.title));
      seeds.push(...extractKeywordCandidates(opportunity.description));
    }
  }

  for (const task of data.tasks.open) {
    if (task.category === "CONTENT") {
      seeds.push(...extractKeywordCandidates(task.title));
      if (task.description) seeds.push(...extractKeywordCandidates(task.description));
    }
  }

  for (const article of [
    ...data.articles.drafts,
    ...data.articles.waitingReview,
    ...data.articles.wordpressDrafts,
  ]) {
    seeds.push(...extractKeywordCandidates(article.title));
  }

  return dedupeKeywords(
    seeds
      .map((seed) => normalizeSeed(seed))
      .filter((seed): seed is string => Boolean(seed))
  );
}

function expandBuyerKeywords(data: MonthlyAutopilotSourceData): string[] {
  const locale = localeFromLanguage(data.website.primaryLanguage);
  const baseSeeds = collectSeedKeywords(data);
  const business = readableBusinessName(data);
  const niche = normalizeSeed(data.website.niche ?? "") ?? normalizeSeed(business) ?? business;
  const brandVoice = readBrandVoiceFromBusinessGoals(data.website.businessGoals);
  const giftOriented = brandVoice?.sellingStyle === "gift-oriented";

  const fallback =
    locale === "ru"
      ? giftOriented
        ? [
            `${niche} в подарок`,
            `заказать ${niche}`,
            `как выбрать ${niche}`,
            `${niche} по фото`,
            `лучший ${niche}`,
          ]
        : [
            `${niche} для малого бизнеса`,
            `как выбрать ${niche}`,
            `стоимость ${niche}`,
            `лучший ${niche}`,
            `заказать ${niche}`,
          ]
      : locale === "et"
        ? [
            `${niche} kingituseks`,
            `kuidas valida ${niche}`,
            `${niche} hind`,
            `parim ${niche}`,
            `telli ${niche}`,
          ]
        : [
            `${niche} gift ideas`,
            `how to choose ${niche}`,
            `${niche} pricing`,
            `best ${niche}`,
            `order ${niche}`,
          ];

  const commercialized = baseSeeds.flatMap((seed) => {
    if (seed.split(/\s+/).length >= 3) return [seed];
    if (locale === "ru") {
      return [`${seed} в подарок`, `заказать ${seed}`, `как выбрать ${seed}`];
    }
    if (locale === "et") {
      return [`${seed} kingituseks`, `telli ${seed}`, `kuidas valida ${seed}`];
    }
    return [`${seed} gift ideas`, `order ${seed}`, `how to choose ${seed}`];
  });

  return dedupeKeywords([...commercialized, ...fallback])
    .map((keyword) => normalizeSeed(keyword))
    .filter((keyword): keyword is string => Boolean(keyword))
    .slice(0, 8);
}

function titleForKeyword(keyword: string, data: MonthlyAutopilotSourceData): string {
  const locale = localeFromLanguage(data.website.primaryLanguage);
  const intent = classifySearchIntent(keyword, {
    niche: data.website.niche,
    isLocalBusiness: true,
  });

  if (locale === "ru") {
    if (intent === "TRANSACTIONAL") return `Где заказать ${keyword}: понятный гид`;
    if (intent === "COMPARISON") return `Как выбрать ${keyword}: сравнение вариантов`;
    if (intent === "COMMERCIAL" || intent === "LOCAL") {
      return `${keyword}: как выбрать лучший вариант`;
    }
    return `Полное руководство: ${keyword}`;
  }

  if (locale === "et") {
    if (intent === "TRANSACTIONAL") return `Kust tellida ${keyword}: praktiline juhend`;
    if (intent === "COMPARISON") return `Kuidas valida ${keyword}: valikute võrdlus`;
    if (intent === "COMMERCIAL" || intent === "LOCAL") {
      return `${keyword}: kuidas valida parim lahendus`;
    }
    return `Täielik juhend: ${keyword}`;
  }

  if (intent === "TRANSACTIONAL") return `Where to order ${keyword}: a practical guide`;
  if (intent === "COMPARISON") return `How to choose ${keyword}: options compared`;
  if (intent === "COMMERCIAL" || intent === "LOCAL") {
    return `${keyword}: how to choose the best option`;
  }
  return `Complete guide: ${keyword}`;
}

export function buildStrategicArticleOpportunities(
  data: MonthlyAutopilotSourceData,
  limit = 5
): StrategicArticleOpportunity[] {
  const locale = localeFromLanguage(data.website.primaryLanguage);
  const existing = new Set(
    [
      ...data.articles.drafts.map((a) => a.title),
      ...data.articles.waitingReview.map((a) => a.title),
      ...data.articles.wordpressDrafts.map((a) => a.title),
      ...data.articles.recentlyCreated.map((a) => a.title),
    ].map(normalizeKeyword)
  );

  const keywords = expandBuyerKeywords(data);
  const opportunities: StrategicArticleOpportunity[] = [];

  for (const keyword of keywords) {
    const title = titleForKeyword(keyword, data);
    const normalizedTitle = normalizeKeyword(title);
    if (!normalizedTitle || existing.has(normalizedTitle)) continue;
    existing.add(normalizedTitle);

    const intent = classifySearchIntent(keyword, {
      niche: data.website.niche,
      isLocalBusiness: true,
    });
    const buyerQuestion = keywordToBuyerQuestion(keyword, intent, locale);

    opportunities.push({
      keyword,
      title,
      reason:
        locale === "ru"
          ? `Тема построена вокруг покупательского запроса «${keyword}»: ${buyerQuestion}. Research brief проверит конкурентов, GEO/AI-поиск и структуру перед генерацией.`
          : locale === "et"
            ? `Teema põhineb ostja päringul „${keyword}": ${buyerQuestion}. Research brief kontrollib konkurente, GEO/AI-otsingut ja struktuuri enne genereerimist.`
            : `Topic built around buyer query "${keyword}": ${buyerQuestion}. The research brief checks competitors, GEO/AI search, and structure before generation.`,
      priority: opportunities.length < 3 ? "high" : "medium",
    });

    if (opportunities.length >= limit) break;
  }

  return opportunities;
}

export function buildStrategicArticlePlanItems(input: {
  data: MonthlyAutopilotSourceData;
  existingArticleCount: number;
  nextItemId: () => string;
  articleIntegration: AutopilotPlanItem["integrationType"];
}): AutopilotPlanItem[] {
  const targetArticleCount = resolveTargetMonthlyArticleTopicCount(input.data);
  const needed = Math.max(0, targetArticleCount - input.existingArticleCount);
  if (needed === 0) return [];

  return buildStrategicArticleOpportunities(input.data, needed).map((opportunity) => ({
    id: input.nextItemId(),
    type: "ARTICLE",
    title: opportunity.title,
    reason: opportunity.reason,
    riskLevel: opportunity.priority === "high" ? "medium" : "low",
    needsIntegration: input.articleIntegration === "wordpress",
    integrationType: input.articleIntegration,
    status: "proposed",
    selected: true,
    reviewQueueHref: "/app/review",
  }));
}

export function resolveTargetMonthlyArticleTopicCount(
  data: MonthlyAutopilotSourceData
): number {
  return Math.min(5, Math.max(3, data.sourceSummary.hasEnoughData ? 4 : 3));
}
