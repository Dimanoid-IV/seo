import * as cheerio from "cheerio";

import { fetchHtmlPage } from "@/lib/audit/fetch";

import { createDefaultBrandVoice } from "./default-voice";
import type {
  BrandVoiceConfidence,
  BrandVoiceFormality,
  BrandVoicePageSample,
  BrandVoiceProfile,
  BrandVoiceSellingStyle,
  BrandVoiceTone,
} from "./types";

const DISCOVERY_PATH_HINTS = [
  /about/i,
  /o[-_]?nas/i,
  /o[-_]?meist/i,
  /services?/i,
  /uslug/i,
  /teenus/i,
  /blog/i,
  /article/i,
  /stat/i,
  /product/i,
  /shop/i,
  /portfolio/i,
  /galere/i,
  /kontakt/i,
  /price/i,
  /cen[ay]/i,
];

const CTA_PATTERNS =
  /(order|buy|contact|request|get|book|заказать|купить|связаться|оставить|заявк|tellimus|kontakt)/i;

const FORMAL_MARKERS =
  /\b(уважаем|господ|вы можете|рекомендуем|пожалуйста|dear|kindly|we recommend|palun|soovitame)\b/i;
const INFORMAL_MARKERS =
  /\b(привет|давай|классно|круто|hey|let's|wanna|tere|äge)\b/i;
const LUXURY_MARKERS =
  /\b(premium|эксклюзив|роскош|luxury|bespoke|handcrafted|уникальн|эксклюзивн)\b/i;
const ARTISTIC_MARKERS =
  /\b(art|портрет|portrait|pop.?art|картин|худож|creative|gift|подар|kunst)\b/i;
const EXPERT_MARKERS =
  /\b(специалист|эксперт|professional|certified|methodology|исследован)\b/i;
const FRIENDLY_MARKERS =
  /\b(с радостью|поможем|для вас|we('re| are) happy|friendly|rõõmuga)\b/i;

const MAX_EXTRA_PAGES = 3;
const PAGE_FETCH_TIMEOUT_MS = 8_000;

function stripNoise(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function uniqueStrings(items: string[], max = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const item = stripNoise(raw);
    if (item.length < 3 || item.length > 160) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

function parsePageHtml(url: string, html: string): BrandVoicePageSample {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, nav, footer, iframe").remove();

  const title = stripNoise($("title").first().text() || $("h1").first().text());
  const headings = $("h1, h2, h3")
    .toArray()
    .map((el) => stripNoise($(el).text()))
    .filter(Boolean)
    .slice(0, 20);

  const paragraphs = $("p, li")
    .toArray()
    .map((el) => stripNoise($(el).text()))
    .filter((t) => t.length >= 40 && t.length <= 400)
    .slice(0, 30);

  const ctaCandidates = $("a, button")
    .toArray()
    .map((el) => stripNoise($(el).text()))
    .filter((t) => t.length >= 2 && t.length <= 80 && CTA_PATTERNS.test(t))
    .slice(0, 20);

  return { url, title, headings, paragraphs, ctaCandidates };
}

function sameOrigin(base: URL, href: string): string | null {
  try {
    const resolved = new URL(href, base);
    if (resolved.origin !== base.origin) return null;
    if (!/^https?:$/i.test(resolved.protocol)) return null;
    resolved.hash = "";
    return resolved.toString();
  } catch {
    return null;
  }
}

function discoverCandidateUrls(baseUrl: string, html: string): string[] {
  const base = new URL(baseUrl);
  const $ = cheerio.load(html);
  const found: string[] = [];
  const seen = new Set<string>([baseUrl.replace(/\/$/, "")]);

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const absolute = sameOrigin(base, href);
    if (!absolute) return;
    const path = new URL(absolute).pathname.toLowerCase();
    if (!DISCOVERY_PATH_HINTS.some((re) => re.test(path))) return;
    const key = absolute.replace(/\/$/, "");
    if (seen.has(key)) return;
    seen.add(key);
    found.push(absolute);
  });

  return found.slice(0, MAX_EXTRA_PAGES);
}

async function safeFetchPage(url: string): Promise<string | null> {
  try {
    const result = await fetchHtmlPage(url, PAGE_FETCH_TIMEOUT_MS);
    return result.html;
  } catch {
    return null;
  }
}

function estimateAvgSentenceLength(texts: string[]): number {
  const joined = texts.join(" ");
  const sentences = joined.split(/[.!?…]+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length === 0) return 14;
  const words = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  return words.reduce((a, b) => a + b, 0) / words.length;
}

function detectTone(corpus: string): BrandVoiceTone {
  if (ARTISTIC_MARKERS.test(corpus)) return "artistic";
  if (LUXURY_MARKERS.test(corpus)) return "luxury";
  if (EXPERT_MARKERS.test(corpus)) return "expert";
  if (FRIENDLY_MARKERS.test(corpus)) return "friendly";
  return "practical";
}

function detectFormality(corpus: string): BrandVoiceFormality {
  const formal = (corpus.match(FORMAL_MARKERS) ?? []).length;
  const informal = (corpus.match(INFORMAL_MARKERS) ?? []).length;
  if (informal > formal + 1) return "informal";
  if (formal > informal + 1) return "formal";
  return "neutral";
}

function detectSellingStyle(
  corpus: string,
  tone: BrandVoiceTone
): BrandVoiceSellingStyle {
  if (tone === "artistic" || /\b(gift|подар|sünnipäev|юбилей)\b/i.test(corpus)) {
    return "gift-oriented";
  }
  if (/\b(consult|консультац|поможем выбрать)\b/i.test(corpus)) {
    return "consultative";
  }
  if (/\b(buy now|заказать сейчас|купите)\b/i.test(corpus)) {
    return "direct";
  }
  return "soft";
}

function inferAudience(corpus: string, language: string): string {
  if (ARTISTIC_MARKERS.test(corpus)) {
    if (language.startsWith("ru")) {
      return "Люди, которые ищут оригинальный портрет или художественный подарок";
    }
    return "People looking for custom portraits or artistic gifts";
  }
  if (language.startsWith("ru")) {
    return "Клиенты малого бизнеса и местные покупатели";
  }
  if (language.startsWith("et")) {
    return "Väikeettevõtte kliendid ja kohalikud ostjad";
  }
  return "Small-business customers and local buyers";
}

function inferCtaStyle(
  ctaCandidates: string[],
  sellingStyle: BrandVoiceSellingStyle,
  language: string
): string {
  if (ctaCandidates.length > 0) {
    const sample = ctaCandidates.slice(0, 3).join("; ");
    return `Match site CTAs such as: ${sample}`;
  }
  if (sellingStyle === "gift-oriented") {
    return language.startsWith("ru")
      ? "Мягкий призыв заказать портрет или подарок — без давления"
      : "Gentle invite to order a portrait or gift — no pressure";
  }
  return language.startsWith("ru")
    ? "Понятный, спокойный призыв связаться или оставить заявку"
    : "Clear, calm invite to contact or request a service";
}

function scoreConfidence(input: {
  pages: number;
  paragraphCount: number;
  phraseCount: number;
  exampleCount: number;
}): { score: number; confidence: BrandVoiceConfidence } {
  let score = 0;
  score += Math.min(input.pages, 4) * 0.15;
  score += Math.min(input.paragraphCount / 10, 1) * 0.35;
  score += Math.min(input.phraseCount / 5, 1) * 0.25;
  score += Math.min(input.exampleCount / 2, 1) * 0.25;

  if (score >= 0.65) return { score, confidence: "high" };
  if (score >= 0.35) return { score, confidence: "medium" };
  return { score, confidence: "low" };
}

function pickCommonPhrases(samples: BrandVoicePageSample[]): string[] {
  const candidates = [
    ...samples.flatMap((s) => s.headings),
    ...samples.flatMap((s) => s.ctaCandidates),
  ];
  return uniqueStrings(candidates, 8);
}

function pickExamples(samples: BrandVoicePageSample[]): string[] {
  return uniqueStrings(
    samples.flatMap((s) => s.paragraphs),
    3
  );
}

/**
 * Extract Brand Voice from website HTML samples (homepage + a few related pages).
 * Pure analysis when `pages` are provided; otherwise fetches live HTML.
 */
export function extractBrandVoiceFromPages(input: {
  language: string;
  pages: BrandVoicePageSample[];
}): BrandVoiceProfile {
  const pages = input.pages.filter(
    (p) => p.paragraphs.length > 0 || p.headings.length > 0
  );

  if (pages.length === 0) {
    return createDefaultBrandVoice({ language: input.language });
  }

  const corpus = pages
    .flatMap((p) => [p.title, ...p.headings, ...p.paragraphs, ...p.ctaCandidates])
    .join("\n");

  const tone = detectTone(corpus);
  const formality = detectFormality(corpus);
  const sellingStyle = detectSellingStyle(corpus, tone);
  const commonPhrases = pickCommonPhrases(pages);
  const examples = pickExamples(pages);
  const ctaCandidates = pages.flatMap((p) => p.ctaCandidates);
  const { confidence } = scoreConfidence({
    pages: pages.length,
    paragraphCount: pages.reduce((n, p) => n + p.paragraphs.length, 0),
    phraseCount: commonPhrases.length,
    exampleCount: examples.length,
  });

  if (confidence === "low") {
    const fallback = createDefaultBrandVoice({
      language: input.language,
      sourceUrls: pages.map((p) => p.url),
    });
    return {
      ...fallback,
      tone: tone === "practical" ? fallback.tone : tone,
      sellingStyle:
        sellingStyle === "soft" ? fallback.sellingStyle : sellingStyle,
      commonPhrases,
      examples,
      ctaStyle: inferCtaStyle(ctaCandidates, sellingStyle, input.language),
      audience: inferAudience(corpus, input.language),
      confidence: "low",
      updatedAt: new Date().toISOString(),
    };
  }

  const avgLen = estimateAvgSentenceLength(
    pages.flatMap((p) => p.paragraphs)
  );

  return {
    language: input.language,
    audience: inferAudience(corpus, input.language),
    tone,
    formality,
    sellingStyle,
    commonPhrases,
    forbiddenPhrases: createDefaultBrandVoice({ language: input.language })
      .forbiddenPhrases,
    ctaStyle: inferCtaStyle(ctaCandidates, sellingStyle, input.language),
    examples,
    confidence,
    sourceUrls: pages.map((p) => p.url),
    updatedAt: new Date().toISOString(),
    manualNotes:
      avgLen < 12
        ? "Prefer shorter sentences like the site copy."
        : avgLen > 22
          ? "Site copy uses longer sentences — keep a thoughtful pace."
          : undefined,
  };
}

export type ExtractBrandVoiceFromWebsiteInput = {
  websiteUrl: string;
  language: string;
  /** Optional pre-fetched homepage HTML (skips homepage fetch). */
  homepageHtml?: string;
};

/**
 * Fetches homepage (+ a few about/services/blog pages) and builds a BrandVoiceProfile.
 */
export async function extractBrandVoiceFromWebsite(
  input: ExtractBrandVoiceFromWebsiteInput
): Promise<BrandVoiceProfile> {
  const homepageUrl = input.websiteUrl.replace(/\/$/, "");
  const homepageHtml =
    input.homepageHtml ?? (await safeFetchPage(homepageUrl));

  if (!homepageHtml) {
    return createDefaultBrandVoice({
      language: input.language,
      sourceUrls: [homepageUrl],
    });
  }

  const pages: BrandVoicePageSample[] = [
    parsePageHtml(homepageUrl, homepageHtml),
  ];

  const candidates = discoverCandidateUrls(homepageUrl, homepageHtml);
  for (const url of candidates) {
    const html = await safeFetchPage(url);
    if (!html) continue;
    pages.push(parsePageHtml(url, html));
  }

  return extractBrandVoiceFromPages({
    language: input.language,
    pages,
  });
}

/** Exported for tests — parse a single HTML blob into a page sample. */
export function parseBrandVoicePageSample(
  url: string,
  html: string
): BrandVoicePageSample {
  return parsePageHtml(url, html);
}
