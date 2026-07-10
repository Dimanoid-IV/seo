import type { SearchIntent } from "./types";

const COMMERCIAL_PATTERNS =
  /\b(best|top|review|pricing|cost|price|купить|цена|стоимость|лучший|parim|hind)\b/i;
const TRANSACTIONAL_PATTERNS =
  /\b(buy|order|book|hire|заказать|купить|tellim|broneer)\b/i;
const COMPARISON_PATTERNS =
  /\b(vs|versus|compare|comparison|сравн|võrdle|alternatives?)\b/i;
const LOCAL_PATTERNS =
  /\b(near me|in [a-z]+|tallinn|tartu|tallinnas|таллин|эстonia|eesti|локальн|local)\b/i;
const NAVIGATIONAL_PATTERNS =
  /\b(login|sign in|official|website|сайт|официальн|kontakt|contact)\b/i;

/**
 * Rule-based search intent classification (deterministic, no AI).
 */
export function classifySearchIntent(
  keyword: string,
  context?: { niche?: string | null; isLocalBusiness?: boolean }
): SearchIntent {
  const text = keyword.toLowerCase();

  if (NAVIGATIONAL_PATTERNS.test(text)) {
    return "NAVIGATIONAL";
  }
  if (COMPARISON_PATTERNS.test(text)) {
    return "COMPARISON";
  }
  if (TRANSACTIONAL_PATTERNS.test(text)) {
    return "TRANSACTIONAL";
  }
  if (LOCAL_PATTERNS.test(text) || context?.isLocalBusiness) {
    return "LOCAL";
  }
  if (COMMERCIAL_PATTERNS.test(text)) {
    return "COMMERCIAL";
  }

  return "INFORMATIONAL";
}

export function isGeoRelevantIntent(intent: SearchIntent): boolean {
  return ["COMMERCIAL", "COMPARISON", "LOCAL", "TRANSACTIONAL"].includes(intent);
}

export function keywordToBuyerQuestion(
  keyword: string,
  intent: SearchIntent,
  locale: "en" | "ru" | "et"
): string {
  const k = keyword.trim();

  if (locale === "ru") {
    switch (intent) {
      case "COMPARISON":
        return `Как выбрать лучший вариант по запросу «${k}»?`;
      case "COMMERCIAL":
        return `Какой сервис или продукт лучше всего подходит для «${k}»?`;
      case "LOCAL":
        return `Какую компанию выбрать для «${k}» в моём регионе?`;
      case "TRANSACTIONAL":
        return `Где лучше заказать «${k}»?`;
      case "NAVIGATIONAL":
        return `Где найти официальную информацию по «${k}»?`;
      default:
        return `Что нужно знать о «${k}» перед выбором?`;
    }
  }

  if (locale === "et") {
    switch (intent) {
      case "COMPARISON":
        return `Kuidas valida parim lahendus päringule „${k}"?`;
      case "COMMERCIAL":
        return `Milline teenus või toode sobib kõige paremini „${k}" jaoks?`;
      case "LOCAL":
        return `Millist ettevõtet valida „${k}" jaoks minu piirkonnas?`;
      case "TRANSACTIONAL":
        return `Kust tellida „${k}"?`;
      case "NAVIGATIONAL":
        return `Kust leida ametlikku infot „${k}" kohta?`;
      default:
        return `Mida peaks teadma „${k}" kohta enne valikut?`;
    }
  }

  switch (intent) {
    case "COMPARISON":
      return `How do I choose the best option for "${k}"?`;
    case "COMMERCIAL":
      return `What is the best service or product for "${k}"?`;
    case "LOCAL":
      return `Which company should I choose for "${k}" in my area?`;
    case "TRANSACTIONAL":
      return `Where should I order "${k}"?`;
    case "NAVIGATIONAL":
      return `Where can I find official information about "${k}"?`;
    default:
      return `What should I know about "${k}" before making a decision?`;
  }
}
