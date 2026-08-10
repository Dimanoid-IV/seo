import type { GeoPlatform, GeoPrompt, SearchIntent } from "./types";
import { isGeoRelevantIntent } from "./intent";
import { containsDomainToken, removeDomainTokens } from "./normalize";

type GeoPromptInput = {
  primaryKeyword: string;
  searchIntent: SearchIntent;
  niche?: string | null;
  businessName?: string | null;
  location?: string | null;
  locale: "en" | "ru" | "et";
};

const PLATFORMS: GeoPlatform[] = [
  "CHATGPT",
  "GEMINI",
  "PERPLEXITY",
  "GOOGLE_AI",
  "GENERIC",
];

function rotatePlatforms(count: number): GeoPlatform[] {
  const result: GeoPlatform[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(PLATFORMS[i % PLATFORMS.length]!);
  }
  return result;
}

function cleanSubject(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const cleaned = removeDomainTokens(value)
    .replace(
      /\s*[:—-]\s*(как выбрать лучший вариант|how to choose the best option|kuidas valida parim lahendus)\.?$/i,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 3 || containsDomainToken(cleaned)) {
    return null;
  }
  return cleaned;
}

function resolvePromptSubject(input: {
  primaryKeyword: string;
  niche?: string | null;
  locale: "en" | "ru" | "et";
}): string {
  const niche = cleanSubject(input.niche);
  if (niche) return niche;
  const keyword = cleanSubject(input.primaryKeyword);
  if (keyword) return keyword;
  if (input.locale === "ru") return "портрет по фото";
  if (input.locale === "et") return "fotost portree";
  return "custom portrait";
}

function resolveBrand(value: string | null | undefined): string | null {
  const cleaned = cleanSubject(value);
  return cleaned && !containsDomainToken(cleaned) ? cleaned : null;
}

/**
 * Generates 3–7 buyer-style GEO prompts (not live AI probing).
 */
export function generateGeoPrompts(input: GeoPromptInput): GeoPrompt[] {
  const {
    primaryKeyword: kw,
    searchIntent,
    niche,
    businessName,
    location,
    locale,
  } = input;

  const subject = resolvePromptSubject({
    primaryKeyword: kw,
    niche: niche?.replace(/_/g, " "),
    locale,
  });
  const keyword = cleanSubject(kw) ?? subject;
  const loc = location ?? (locale === "et" ? "Eestis" : locale === "ru" ? "в вашем регионе" : "in my area");
  const brand = resolveBrand(businessName);

  const templates: Array<{ prompt: string; angle: string }> = [];

  if (locale === "ru") {
    templates.push(
      {
        prompt: `Как выбрать ${subject} ${loc}?`,
        angle: "Практичный ответ на покупательский выбор",
      },
      {
        prompt: `Где заказать ${keyword} и на что смотреть перед оплатой?`,
        angle: "Транзакционный intent без подмены продукта брендом",
      },
      {
        prompt: `Сравните варианты ${subject}: цена, стиль, сроки и качество.`,
        angle: "Объективное сравнение категории",
      },
      {
        prompt: `Что важно знать перед выбором ${subject}?`,
        angle: "Образовательный контент для AI-ответов",
      },
      {
        prompt: brand
          ? `Подходит ли ${brand} для заказа «${keyword}» или лучше искать альтернативы?`
          : `Как выбрать надёжного исполнителя для «${keyword}»?`,
        angle: "Упоминание бренда в контексте выбора",
      }
    );

    if (searchIntent === "LOCAL" || searchIntent === "COMMERCIAL") {
      templates.push({
        prompt: `Где найти проверенного исполнителя для «${keyword}» ${loc}?`,
        angle: "Локальный intent для AI-поиска",
      });
    }

    if (searchIntent === "COMPARISON") {
      templates.push({
        prompt: `Какие варианты «${keyword}» лучше сравнить перед заказом?`,
        angle: "Comparison intent для Perplexity/Gemini",
      });
    }
  } else if (locale === "et") {
    templates.push(
      {
        prompt: `Kuidas valida ${subject} ${loc}?`,
        angle: "Praktiline vastus ostja valikule",
      },
      {
        prompt: `Kust tellida „${keyword}" ja mida enne maksmist kontrollida?`,
        angle: "Tehinguline intent ilma toote ja brändi segamini ajamiseta",
      },
      {
        prompt: `Võrdle ${subject} valikuid: hind, stiil, tähtaeg ja kvaliteet.`,
        angle: "Objektiivne kategooria võrdlus",
      },
      {
        prompt: `Mida peaks teadma enne ${subject} valimist?`,
        angle: "Hariv sisu AI-vastuste jaoks",
      },
      {
        prompt: brand
          ? `Kas ${brand} sobib päringule „${keyword}" või tasub võrrelda alternatiive?`
          : `Kuidas valida usaldusväärne tegija päringule „${keyword}"?`,
        angle: "Brändi mainimine valiku kontekstis",
      }
    );

    if (searchIntent === "LOCAL" || searchIntent === "COMMERCIAL") {
      templates.push({
        prompt: `Kust leida usaldusväärset tegijat päringule „${keyword}" ${loc}?`,
        angle: "Kohalik intent AI-otsingus",
      });
    }
  } else {
    templates.push(
      {
        prompt: `How do I choose a ${subject} ${loc}?`,
        angle: "Practical buyer-choice answer",
      },
      {
        prompt: `Where should I order "${keyword}" and what should I check first?`,
        angle: "Transactional intent without confusing brand and product",
      },
      {
        prompt: `Compare ${subject} options: price, style, timing, and quality.`,
        angle: "Objective category comparison",
      },
      {
        prompt: `What should I know before choosing a ${subject} provider?`,
        angle: "Educational content for AI answers",
      },
      {
        prompt: brand
          ? `Is ${brand} a good choice for "${keyword}", or should I compare alternatives?`
          : `How do I choose a reliable provider for "${keyword}"?`,
        angle: "Brand mention in decision context",
      }
    );

    if (searchIntent === "LOCAL" || searchIntent === "COMMERCIAL") {
      templates.push({
        prompt: `Where can I find a reliable provider for "${keyword}" ${loc}?`,
        angle: "Local intent for AI search",
      });
    }
  }

  const count = isGeoRelevantIntent(searchIntent)
    ? Math.min(7, Math.max(5, templates.length))
    : Math.min(5, Math.max(3, templates.length));

  const selected = templates.slice(0, count);
  const platforms = rotatePlatforms(selected.length);

  return selected.map((item, index) => ({
    prompt: item.prompt,
    platform: platforms[index]!,
    desiredMentionAngle: item.angle,
  }));
}
