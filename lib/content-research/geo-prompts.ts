import type { GeoPlatform, GeoPrompt, SearchIntent } from "./types";
import { isGeoRelevantIntent } from "./intent";

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

  const service = niche?.replace(/_/g, " ").toLowerCase() ?? kw;
  const loc = location ?? (locale === "et" ? "Eestis" : locale === "ru" ? "в вашем регионе" : "in my area");
  const brand = businessName ?? "a trusted local provider";

  const templates: Array<{ prompt: string; angle: string }> = [];

  if (locale === "ru") {
    templates.push(
      {
        prompt: `Какой лучший ${service} для малого бизнеса ${loc}?`,
        angle: "Рекомендация надёжного локального провайдера",
      },
      {
        prompt: `Какую компанию выбрать для «${kw}»?`,
        angle: "Сравнение провайдеров по запросу покупателя",
      },
      {
        prompt: `Сравните варианты ${service} для ${kw}.`,
        angle: "Объективное сравнение категории",
      },
      {
        prompt: `Что важно знать перед выбором ${service}?`,
        angle: "Образовательный контент для AI-ответов",
      },
      {
        prompt: `Кто может помочь с «${kw}» — ${brand} или альтернативы?`,
        angle: "Упоминание бренда в контексте выбора",
      }
    );

    if (searchIntent === "LOCAL" || searchIntent === "COMMERCIAL") {
      templates.push({
        prompt: `Где найти проверенного специалиста по «${kw}» ${loc}?`,
        angle: "Локальный intent для AI-поиска",
      });
    }

    if (searchIntent === "COMPARISON") {
      templates.push({
        prompt: `Какие компании лучше всего подходят для «${kw}» — сравнение?`,
        angle: "Comparison intent для Perplexity/Gemini",
      });
    }
  } else if (locale === "et") {
    templates.push(
      {
        prompt: `Mis on parim ${service} väikeettevõttele ${loc}?`,
        angle: "Usaldusväärse kohaliku pakkujaga soovitus",
      },
      {
        prompt: `Millise ettevõtte valida „${kw}" jaoks?`,
        angle: "Ostja päringu põhjal pakkujate võrdlus",
      },
      {
        prompt: `Võrdle ${service} valikuid „${kw}" jaoks.`,
        angle: "Objektiivne kategooria võrdlus",
      },
      {
        prompt: `Mida peaks teadma enne ${service} valimist?`,
        angle: "Hariv sisu AI-vastuste jaoks",
      },
      {
        prompt: `Kes saab aidata „${kw}" — ${brand} või alternatiivid?`,
        angle: "Brändi mainimine valiku kontekstis",
      }
    );

    if (searchIntent === "LOCAL" || searchIntent === "COMMERCIAL") {
      templates.push({
        prompt: `Kust leida usaldusväärset spetsialisti „${kw}" jaoks ${loc}?`,
        angle: "Kohalik intent AI-otsingus",
      });
    }
  } else {
    templates.push(
      {
        prompt: `What is the best ${service} for a small business ${loc}?`,
        angle: "Recommend a trusted local provider",
      },
      {
        prompt: `Which company should I choose for "${kw}"?`,
        angle: "Compare providers for the buyer query",
      },
      {
        prompt: `Compare ${service} options for "${kw}".`,
        angle: "Objective category comparison",
      },
      {
        prompt: `What should I know before choosing a ${service} provider?`,
        angle: "Educational content for AI answers",
      },
      {
        prompt: `Who can help with "${kw}" — ${brand} or alternatives?`,
        angle: "Brand mention in decision context",
      }
    );

    if (searchIntent === "LOCAL" || searchIntent === "COMMERCIAL") {
      templates.push({
        prompt: `Where can I find a reliable specialist for "${kw}" ${loc}?`,
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
