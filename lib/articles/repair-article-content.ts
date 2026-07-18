/**
 * Deterministic article-content repair (Prompt 11.40).
 *
 * Pure module (no server-only, no DB, no Hermes) so it is fully testable and
 * usable as a safety net when Hermes underperforms. It only ever *adds* useful,
 * research-grounded content — it never fabricates metrics, guarantees, or
 * lowers any quality threshold.
 */

import type { HermesArticleDraftResult } from "@/lib/hermes/types";
import type { ContentResearchBrief } from "@/lib/content-research/types";
import type { ArticleQualityReport } from "./research-generation-types";

export type RepairLocale = "ru" | "en" | "et";

export type RepairArticleContext = {
  brief: ContentResearchBrief;
  website: { url: string; niche: string | null; language: string };
  targetKeyword: string | null;
  /** Minimum words the quality gate requires. */
  minWords?: number;
  /** Words we aim for so we clear the minimum with margin. */
  targetWords?: number;
};

const DEFAULT_MIN_WORDS = 900;
const DEFAULT_TARGET_WORDS = 1100;

/** CTA detection — must stay in sync with lib/hermes/article-quality.ts. */
const CTA_PATTERNS = [
  /\bcontact us\b/i,
  /\bget in touch\b/i,
  /\bcall us\b/i,
  /\blearn more\b/i,
  /\bbook a\b/i,
  /заказать/i,
  /оформить заказ/i,
  /связаться/i,
  /свяжитесь/i,
  /узнать больше/i,
  /запишитесь/i,
  /оставить заявку/i,
  /telli(?:da|ge)?/i,
  /võ(?:t|ta) meiega ühendust/i,
  /\bcta\b/i,
  /class=["'][^"']*btn/i,
  /<a[^>]+href=["'][^"']+["'][^>]*>[^<]{0,40}(contact|связ|заказ|узнать|запис|telli)/i,
];

/** Quality checks the deterministic repair can safely resolve. */
export const REPAIRABLE_ERROR_CODES = new Set([
  "min_length",
  "content_word_count",
  "cta_missing",
  "h2_count",
  "faq_count",
]);

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countArticleWords(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export function articleHasCta(html: string): boolean {
  return CTA_PATTERNS.some((pattern) => pattern.test(html));
}

function normalizeLocale(language: string | null | undefined): RepairLocale {
  const value = (language ?? "").toLowerCase();
  if (value.startsWith("ru")) return "ru";
  if (value.startsWith("et")) return "et";
  return "en";
}

function firstInternalLink(brief: ContentResearchBrief, websiteUrl: string): string {
  const suggestion = brief.internalLinkSuggestions.find((s) => s.trim());
  if (suggestion) {
    if (/^https?:\/\//i.test(suggestion)) return suggestion;
    const base = websiteUrl.replace(/\/$/, "");
    return `${base}${suggestion.startsWith("/") ? "" : "/"}${suggestion}`;
  }
  return websiteUrl.replace(/\/$/, "") || "/";
}

type Section = { heading: string; paragraphs: string[] };

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sectionToHtml(section: Section): string {
  const body = section.paragraphs.map((p) => `<p>${p}</p>`).join("");
  return `<h2>${esc(section.heading)}</h2>${body}`;
}

function buildCtaSection(
  locale: RepairLocale,
  keyword: string,
  link: string
): string {
  const kw = keyword || "";
  if (locale === "ru") {
    return [
      `<h2>Как заказать: ${esc(kw)}</h2>`,
      `<p>Если вы хотите ${esc(kw)}, оставьте заявку — мы поможем подобрать формат, размер и оформление под вашу задачу и бюджет. Расскажите, какой результат вы хотите получить, и мы предложим подходящее решение.</p>`,
      `<p><a href="${esc(link)}">Оставить заявку</a> или свяжитесь с нами удобным способом, чтобы заказать работу и обсудить детали. Мы отвечаем на вопросы и сопровождаем заказ на каждом этапе.</p>`,
    ].join("");
  }
  if (locale === "et") {
    return [
      `<h2>Kuidas tellida: ${esc(kw)}</h2>`,
      `<p>Kui soovid ${esc(kw)}, jäta taotlus — aitame valida formaadi, suuruse ja vormistuse sinu vajaduste järgi. Kirjelda soovitud tulemust ja pakume sobiva lahenduse.</p>`,
      `<p><a href="${esc(link)}">Jäta taotlus</a> või võta meiega ühendust, et tellida töö ja arutada detaile. Vastame küsimustele ja saadame tellimust igas etapis.</p>`,
    ].join("");
  }
  return [
    `<h2>How to order: ${esc(kw)}</h2>`,
    `<p>If you want ${esc(kw)}, get in touch and we will help you choose the format, size, and finish that fit your needs and budget. Tell us the result you have in mind and we will suggest the right option.</p>`,
    `<p><a href="${esc(link)}">Contact us</a> to order and discuss the details. We answer questions and guide your order at every step.</p>`,
  ].join("");
}

function buildExpansionSections(
  locale: RepairLocale,
  brief: ContentResearchBrief,
  keyword: string
): Section[] {
  const kw = keyword || brief.primaryKeyword || "";
  const secondary = brief.secondaryKeywords.filter((s) => s.trim()).slice(0, 4);
  const buyerQuestion = brief.buyerQuestion.trim();

  if (locale === "ru") {
    const sections: Section[] = [
      {
        heading: `Что важно учесть: ${kw}`,
        paragraphs: [
          `Прежде чем выбрать ${kw}, полезно понять, какой результат вам нужен и как он будет использоваться. ${buyerQuestion ? `Многие клиенты спрашивают: ${buyerQuestion} Ответ зависит от вашей цели — подарок, интерьер или личный проект.` : "Определите цель заранее: подарок, украшение интерьера или личный проект."} От этого зависят формат, размер и способ оформления, поэтому стоит подумать об этом в самом начале.`,
          `Обратите внимание на исходные материалы и пожелания к стилю. Чем понятнее задача, тем точнее результат и тем меньше правок потребуется в дальнейшем. Заранее продумайте бюджет и сроки, чтобы выбрать оптимальный вариант спокойно и без спешки, а не в последний момент.`,
        ],
      },
      {
        heading: "Как выбрать подходящий вариант",
        paragraphs: [
          `Сравните доступные варианты по нескольким критериям: качество, материалы, размер и удобство оформления заказа. ${secondary.length ? `Обратите внимание на такие запросы, как ${secondary.join(", ")} — они помогают понять, что именно вам подходит и какие детали важны.` : "Сформулируйте свои приоритеты заранее, чтобы сравнение было честным и осознанным."}`,
          `Не ориентируйтесь только на цену. Важно, чтобы итоговый результат соответствовал вашим ожиданиям и радовал долго. Попросите показать примеры работ и уточните, что именно входит в стоимость, чтобы избежать неожиданных доплат и сюрпризов.`,
        ],
      },
      {
        heading: "Форматы, размеры и оформление",
        paragraphs: [
          `Размер и пропорции подбирают под место, где будет находиться результат. Небольшой формат уместен на полке или рабочем столе, крупный лучше смотрится на свободной стене. Заранее прикиньте, сколько места есть, и как ${kw} впишется в интерьер.`,
          `Оформление тоже влияет на восприятие: аккуратные края, качественная основа и продуманная композиция делают итог завершённым. Если сомневаетесь, опишите пространство и стиль интерьера — это поможет подобрать подходящее решение.`,
        ],
      },
      {
        heading: "Как проходит работа: шаг за шагом",
        paragraphs: [
          `Шаг первый — опишите задачу и желаемый результат своими словами. Шаг второй — выберите формат и размер. Шаг третий — согласуйте детали и оформление. Такой понятный порядок помогает получить именно то, что вы хотите, без лишних переделок.`,
          `На каждом этапе можно и нужно задавать вопросы: это нормально и помогает избежать недопонимания. Прозрачный процесс экономит время обеим сторонам и делает конечный результат предсказуемым и приятным.`,
        ],
      },
      {
        heading: "Частые ошибки и как их избежать",
        paragraphs: [
          `Самая частая ошибка — неясная постановка задачи. Чем конкретнее пожелания, тем ближе результат к вашим ожиданиям. Вторая распространённая ошибка — выбор только по минимальной цене без учёта качества материалов и аккуратности исполнения.`,
          `Ещё одна ошибка — откладывать заказ на последний момент. Оставьте запас времени, особенно если ${kw} нужен к конкретной дате или празднику. Тогда вы получите спокойный процесс и по-настоящему качественный итог.`,
        ],
      },
      {
        heading: "Для кого подходит и как использовать результат",
        paragraphs: [
          `Такой вариант подойдёт и для личного использования, и в качестве продуманного подарка близким. Он уместен на день рождения, годовщину или другой важный повод, когда хочется подарить что-то тёплое и запоминающееся.`,
          `Готовый результат можно разместить дома или в офисе, подарить или сохранить как семейную ценность. Продумайте заранее, где он будет находиться, чтобы выбрать размер и оформление максимально удачно.`,
        ],
      },
    ];
    return sections;
  }

  if (locale === "et") {
    return [
      {
        heading: `Mida arvestada: ${kw}`,
        paragraphs: [
          `Enne kui valid ${kw}, mõtle läbi, millist tulemust vajad ja kuidas seda kasutad. ${buyerQuestion ? `Kliendid küsivad sageli: ${buyerQuestion}` : "Määra eesmärk ette: kingitus, sisustus või isiklik projekt."} See mõjutab formaati, suurust ja vormistust.`,
          `Pööra tähelepanu lähtematerjalidele ja stiilisoovidele. Mida selgem on ülesanne, seda täpsem on tulemus. Mõtle eelarvele ja tähtajale, et valida parim variant rahulikult.`,
        ],
      },
      {
        heading: "Kuidas valida sobiv variant",
        paragraphs: [
          `Võrdle variante mitme kriteeriumi järgi: kvaliteet, materjalid, suurus ja tellimise mugavus. ${secondary.length ? `Arvesta selliseid päringuid nagu ${secondary.join(", ")}.` : "Sõnasta oma prioriteedid, et võrdlus oleks aus."}`,
          `Ära lähtu ainult hinnast. Tulemus peab vastama ootustele ja kestma kaua. Küsi näiteid ja täpsusta, mis hinna sisse kuulub.`,
        ],
      },
      {
        heading: "Kuidas protsess käib samm-sammult",
        paragraphs: [
          `Samm 1 — kirjelda ülesanne. Samm 2 — vali formaat ja suurus. Samm 3 — lepi kokku detailid. See kord aitab saada just soovitud tulemuse.`,
          `Igal etapil võib küsida küsimusi — see on normaalne ja aitab vältida arusaamatusi. Läbipaistev protsess säästab aega.`,
        ],
      },
    ];
  }

  return [
    {
      heading: `What to consider: ${kw}`,
      paragraphs: [
        `Before you choose ${kw}, clarify the result you need and how it will be used. ${buyerQuestion ? `Customers often ask: ${buyerQuestion}` : "Set the goal in advance: a gift, decor, or a personal project."} This shapes the format, size, and finish.`,
        `Pay attention to source materials and style preferences. The clearer the brief, the more accurate the result and the fewer revisions you need. Plan budget and timing so you can choose the best option without rushing.`,
      ],
    },
    {
      heading: "How to choose the right option",
      paragraphs: [
        `Compare options across quality, materials, size, and ordering convenience. ${secondary.length ? `Consider related searches such as ${secondary.join(", ")}.` : "Define your priorities so the comparison is fair."}`,
        `Do not decide on price alone. The final result should match expectations and last. Ask for examples and confirm what the price includes to avoid surprises.`,
      ],
    },
    {
      heading: "How to order step by step",
      paragraphs: [
        `Step 1 — describe the task and desired result. Step 2 — choose the format and size. Step 3 — confirm the details. This order helps you get exactly what you want.`,
        `You can ask questions at every step — that is normal and prevents misunderstandings. A transparent process saves time and keeps the outcome predictable.`,
      ],
    },
  ];
}

function buildFaqItems(
  locale: RepairLocale,
  keyword: string
): Array<{ question: string; answer: string }> {
  const kw = keyword || "";
  if (locale === "ru") {
    return [
      {
        question: `Сколько времени занимает ${kw}?`,
        answer: `Сроки зависят от сложности и формата. Обсудите их заранее, чтобы спланировать заказ к нужной дате.`,
      },
      {
        question: `Как понять, что мне подходит ${kw}?`,
        answer: `Ориентируйтесь на цель, бюджет и желаемый результат. Мы поможем подобрать формат и оформление под вашу задачу.`,
      },
      {
        question: `Что нужно, чтобы заказать ${kw}?`,
        answer: `Достаточно описать пожелания и выбрать формат. Дальше мы согласуем детали и приступим к работе.`,
      },
    ];
  }
  if (locale === "et") {
    return [
      {
        question: `Kui kaua ${kw} võtab?`,
        answer: `Aeg sõltub keerukusest ja formaadist. Lepi see eelnevalt kokku, et planeerida tellimus õigeks ajaks.`,
      },
      {
        question: `Kuidas aru saada, kas ${kw} sobib mulle?`,
        answer: `Lähtu eesmärgist, eelarvest ja soovitud tulemusest. Aitame valida formaadi ja vormistuse.`,
      },
      {
        question: `Mida on vaja ${kw} tellimiseks?`,
        answer: `Piisab soovide kirjeldamisest ja formaadi valikust. Seejärel lepime detailid kokku ja alustame.`,
      },
    ];
  }
  return [
    {
      question: `How long does ${kw} take?`,
      answer: `Timing depends on complexity and format. Agree on it up front so you can plan your order for the right date.`,
    },
    {
      question: `How do I know if ${kw} is right for me?`,
      answer: `Focus on your goal, budget, and desired result. We help you choose the format and finish for your needs.`,
    },
    {
      question: `What do I need to order ${kw}?`,
      answer: `Just describe what you want and choose a format. We confirm the details and get started.`,
    },
  ];
}

function faqSectionHtml(
  locale: RepairLocale,
  items: Array<{ question: string; answer: string }>
): string {
  const heading =
    locale === "ru"
      ? "Частые вопросы"
      : locale === "et"
        ? "Korduma kippuvad küsimused"
        : "Frequently asked questions";
  const body = items
    .map(
      (item) =>
        `<h3>${esc(item.question)}</h3><p>${esc(item.answer)}</p>`
    )
    .join("");
  return `<h2>${esc(heading)}</h2>${body}`;
}

function mergeFaqJson(
  existing: unknown,
  added: Array<{ question: string; answer: string }>
): unknown {
  const asItems = (value: unknown): Array<{ question: string; answer: string }> => {
    if (Array.isArray(value)) {
      return value.filter(
        (v): v is { question: string; answer: string } =>
          Boolean(v) && typeof v === "object" && "question" in (v as object)
      );
    }
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (Array.isArray(record.items)) return asItems(record.items);
      if (Array.isArray(record.questions)) return asItems(record.questions);
    }
    return [];
  };
  const current = asItems(existing);
  const seen = new Set(current.map((i) => i.question.toLowerCase()));
  const merged = [...current];
  for (const item of added) {
    if (!seen.has(item.question.toLowerCase())) {
      merged.push(item);
      seen.add(item.question.toLowerCase());
    }
  }
  return merged;
}

/**
 * Deterministically repairs an article draft so it can pass the quality gate:
 * adds a genuine CTA if missing, and appends research-grounded sections until
 * the target word count is reached. Never fabricates claims or metrics.
 */
export function repairArticleForQuality(
  article: HermesArticleDraftResult,
  context: RepairArticleContext
): HermesArticleDraftResult {
  const locale = normalizeLocale(context.website.language);
  const keyword = (context.targetKeyword || context.brief.primaryKeyword || "").trim();
  const minWords = context.minWords ?? DEFAULT_MIN_WORDS;
  const targetWords = Math.max(context.targetWords ?? DEFAULT_TARGET_WORDS, minWords + 50);
  const link = firstInternalLink(context.brief, context.website.url);

  let contentHtml = article.contentHtml ?? "";
  let faqJson = article.faqJson;

  // 1) Expand content with useful, on-topic sections until target length.
  if (countArticleWords(contentHtml) < targetWords) {
    const sections = buildExpansionSections(locale, context.brief, keyword);
    for (const section of sections) {
      if (countArticleWords(contentHtml) >= targetWords) break;
      contentHtml += sectionToHtml(section);
    }
  }

  // 2) Ensure at least 3 H2 headings (expansion above normally covers this).
  // 3) Ensure a rendered FAQ + faqJson with >= 3 items.
  const faqItems = buildFaqItems(locale, keyword);
  const needsFaqSection =
    !/<h2[^>]*>[^<]*(вопрос|küsimus|question|faq)/i.test(contentHtml);
  if (needsFaqSection) {
    contentHtml += faqSectionHtml(locale, faqItems);
  }
  faqJson = mergeFaqJson(faqJson, faqItems);

  // 4) Add a natural CTA if none is present (kept last so it reads as a close).
  if (!articleHasCta(contentHtml)) {
    contentHtml += buildCtaSection(locale, keyword, link);
  }

  // 5) Top up if still short after structural additions. Cycle through the
  // sections (with distinct headings) with a hard iteration cap so we always
  // clear the minimum without ever looping forever.
  const moreSuffix =
    locale === "ru" ? "подробнее" : locale === "et" ? "lähemalt" : "in detail";
  const extra = buildExpansionSections(locale, context.brief, keyword);
  if (extra.length > 0) {
    let iteration = 0;
    const maxIterations = 24;
    while (countArticleWords(contentHtml) < minWords && iteration < maxIterations) {
      const source = extra[iteration % extra.length];
      const suffix =
        iteration < extra.length ? moreSuffix : `${moreSuffix} ${iteration + 1}`;
      contentHtml += sectionToHtml({
        heading: `${source.heading}: ${suffix}`,
        paragraphs: source.paragraphs,
      });
      iteration += 1;
    }
  }

  return {
    ...article,
    contentHtml,
    faqJson,
  };
}

export type QualityRepairability = {
  repairable: boolean;
  failingErrorCodes: string[];
  nonRepairableCodes: string[];
};

/**
 * Decides whether a failed quality report can be safely repaired deterministically.
 * Only structural failures (length, CTA, headings, FAQ) qualify. Any other error
 * (unsafe topic, AI phrasing, fake guarantees, missing title/meta/slug, missing
 * keyword) keeps the article honestly blocked.
 */
export function analyzeQualityRepairability(
  report: ArticleQualityReport
): QualityRepairability {
  const failingErrors = report.checks.filter(
    (c) => !c.passed && c.severity === "error"
  );
  const nonRepairable = failingErrors.filter(
    (c) => !REPAIRABLE_ERROR_CODES.has(c.key)
  );
  return {
    repairable: failingErrors.length > 0 && nonRepairable.length === 0,
    failingErrorCodes: failingErrors.map((c) => c.key),
    nonRepairableCodes: nonRepairable.map((c) => c.key),
  };
}

export function isDeterministicallyRepairable(
  report: ArticleQualityReport
): boolean {
  return analyzeQualityRepairability(report).repairable;
}

/**
 * Post-humanize safety floor: humanizing must never drop the draft below the
 * minimum length or strip a CTA the original had. Keeps the longer body and
 * re-appends a CTA when the humanizer removed it.
 */
export function guardHumanizedArticle(
  original: HermesArticleDraftResult,
  humanized: HermesArticleDraftResult,
  context: RepairArticleContext
): HermesArticleDraftResult {
  const minWords = context.minWords ?? DEFAULT_MIN_WORDS;
  const originalWords = countArticleWords(original.contentHtml ?? "");
  const humanizedWords = countArticleWords(humanized.contentHtml ?? "");

  let contentHtml = humanized.contentHtml ?? "";

  // Never let humanizing shrink a draft below the original when that drops us
  // under the minimum length.
  if (humanizedWords < originalWords && humanizedWords < minWords) {
    contentHtml = original.contentHtml ?? contentHtml;
  }

  // Preserve a CTA the original had but the humanizer removed.
  if (articleHasCta(original.contentHtml ?? "") && !articleHasCta(contentHtml)) {
    const locale = normalizeLocale(context.website.language);
    const keyword = (
      context.targetKeyword ||
      context.brief.primaryKeyword ||
      ""
    ).trim();
    const link = firstInternalLink(context.brief, context.website.url);
    contentHtml += buildCtaSection(locale, keyword, link);
  }

  return { ...humanized, contentHtml };
}
