/**
 * Dry-run payload inspection for Brand Voice in article generation.
 * Run with: npx tsx lib/brand-voice/generation-payload.test.ts
 *
 * Does not call Hermes or generate articles.
 */

import assert from "node:assert/strict";

import { buildResearchTaskContext } from "@/lib/articles/build-research-context";
import type { ContentResearchBrief } from "@/lib/content-research/types";

import { extractBrandVoiceFromPages, parseBrandVoicePageSample } from "./extract-brand-voice";
import {
  buildBrandVoiceCtaGuidance,
  buildBrandVoiceGenerationInstructions,
} from "./prompt-instructions";

const brief = {
  id: "brief-test",
  primaryKeyword: "портрет поп арт",
  secondaryKeywords: ["портрет на заказ"],
  searchIntent: "commercial",
  buyerQuestion: "Где заказать поп-арт портрет в подарок?",
  geoPrompts: [],
  competitors: [],
  competitorsUnavailable: true,
  contentGapSummary: "Need practical ordering guide",
  recommendedArticleTitle: "Как заказать поп-арт портрет",
  outline: ["Intro", "Styles", "How to order", "FAQ"],
  faq: ["Сколько стоит?", "Сколько ждать?", "Какое фото нужно?"],
  internalLinkSuggestions: [],
  schemaSuggestions: ["Article", "FAQPage"],
  qualityRequirements: ["No fake claims"],
  evidence: [],
  riskLevel: "low",
} as unknown as ContentResearchBrief;

const html = `
<html><body>
  <h1>Pop-art портреты</h1>
  <p>Яркие портреты по фото — художественный подарок для близких.</p>
  <a href="/order">Заказать портрет</a>
  <p>Мы поможем выбрать стиль и оформим заказ без лишней суеты.</p>
</body></html>
`;

const voice = extractBrandVoiceFromPages({
  language: "ru",
  pages: [parseBrandVoicePageSample("https://popart.ee", html)],
});

const context = buildResearchTaskContext(brief, voice);
const instructions = (context.generationInstructions as string[]).join("\n");

assert.ok(instructions.includes("BRAND VOICE"));
assert.ok(/language:\s*ru/i.test(instructions));
assert.ok(context.brandVoice);

const cta = buildBrandVoiceCtaGuidance(voice, brief.recommendedArticleTitle, "https://popart.ee");
assert.ok(/popart\.ee/i.test(cta));
assert.ok(!/guaranteed ranking/i.test(cta));

const payloadPreview = {
  website: { url: "https://popart.ee", language: "ru", niche: "art" },
  brandVoice: {
    language: voice.language,
    tone: voice.tone,
    sellingStyle: voice.sellingStyle,
    audience: voice.audience,
    ctaStyle: voice.ctaStyle,
    confidence: voice.confidence,
    commonPhrases: voice.commonPhrases.slice(0, 5),
  },
  generationInstructionSample: buildBrandVoiceGenerationInstructions(voice).slice(0, 6),
  ctaGuidance: cta,
};

console.log(JSON.stringify(payloadPreview, null, 2));
console.log("generation-payload brand-voice checks passed");
