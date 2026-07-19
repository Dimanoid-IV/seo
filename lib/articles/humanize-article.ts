import "server-only";

import {
  buildBrandVoiceHumanizerAddendum,
  type BrandVoiceProfile,
} from "@/lib/brand-voice";
import { isHermesConfigured, repairArticleDraft } from "@/lib/hermes/client";
import type { HermesArticleDraftResult } from "@/lib/hermes/types";
import type { ContentResearchBrief } from "@/lib/content-research/types";

export type HumanizeArticleResult = {
  article: HermesArticleDraftResult;
  humanizedAt: string;
  method: "hermes" | "deterministic";
};

const GENERIC_AI_PHRASES = [
  /\bas an ai\b/gi,
  /\bas a language model\b/gi,
  /\bi cannot\b/gi,
  /\bin today's digital landscape\b/gi,
  /\bin conclusion\b/gi,
  /\bit is important to note\b/gi,
  /\bdelve into\b/gi,
  /\bunlock the power\b/gi,
  /\bgame.?changer\b/gi,
  /\bна сегодняшний день\b/gi,
  /\bв заключение\b/gi,
  /\bкак искусственный интеллект\b/gi,
  /\btänapäeval\b/gi,
  /\bkokkuvõttes\b/gi,
];

const FILLER_PARAGRAPHS = [
  /<p>\s*(This article (will|aims to) (explore|discuss|cover)[^<]*)<\/p>/gi,
  /<p>\s*(В этой статье мы (рассмотрим|поговорим)[^<]*)<\/p>/gi,
  /<p>\s*(Selles artiklis[^<]*)<\/p>/gi,
];

function stripGenericPhrases(html: string): string {
  let result = html;
  for (const pattern of GENERIC_AI_PHRASES) {
    result = result.replace(pattern, "");
  }
  for (const pattern of FILLER_PARAGRAPHS) {
    result = result.replace(pattern, "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

function ensureBuyerQuestionMention(
  html: string,
  brief: ContentResearchBrief
): string {
  const question = brief.buyerQuestion.trim();
  if (!question || question.length < 8) {
    return html;
  }

  const plain = html.replace(/<[^>]+>/g, " ").toLowerCase();
  const questionWords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 4);

  const hasOverlap =
    questionWords.length > 0 &&
    questionWords.filter((w) => plain.includes(w)).length >= 2;

  if (hasOverlap) {
    return html;
  }

  const snippet = question.endsWith("?") ? question : `${question}?`;
  const insert = `<p><strong>${snippet}</strong></p>`;
  const firstH2 = html.search(/<h2[\s>]/i);
  if (firstH2 > 0) {
    return `${html.slice(0, firstH2)}${insert}${html.slice(firstH2)}`;
  }
  return `${insert}${html}`;
}

function humanizeMetaFields(
  draft: HermesArticleDraftResult,
  brief: ContentResearchBrief
): HermesArticleDraftResult {
  let metaTitle = draft.metaTitle?.trim() ?? "";
  let metaDescription = draft.metaDescription?.trim() ?? "";

  if (metaTitle.toLowerCase().includes("ultimate guide")) {
    metaTitle = metaTitle.replace(/ultimate guide/gi, "practical guide");
  }

  if (
    brief.primaryKeyword &&
    !metaTitle.toLowerCase().includes(brief.primaryKeyword.toLowerCase())
  ) {
    const trimmed = `${brief.primaryKeyword} — ${metaTitle}`;
    if (trimmed.length <= 60) {
      metaTitle = trimmed;
    }
  }

  if (
    brief.buyerQuestion &&
    metaDescription.length < 140 &&
    !metaDescription.includes("?")
  ) {
    const addition = ` ${brief.buyerQuestion}`;
    if (metaDescription.length + addition.length <= 160) {
      metaDescription = `${metaDescription}${addition}`;
    }
  }

  return {
    ...draft,
    metaTitle,
    metaDescription,
  };
}

/**
 * Deterministic humanizer — removes generic AI filler and injects brief context.
 */
export function humanizeArticleDeterministic(
  draft: HermesArticleDraftResult,
  brief: ContentResearchBrief
): HermesArticleDraftResult {
  const contentHtml = ensureBuyerQuestionMention(
    stripGenericPhrases(draft.contentHtml ?? ""),
    brief
  );

  return humanizeMetaFields(
    {
      ...draft,
      contentHtml,
      title: stripGenericPhrases(draft.title ?? ""),
    },
    brief
  );
}

const HUMANIZER_REPAIR_INSTRUCTIONS = `Humanize this article draft:
- Remove generic AI filler and robotic section sameness.
- Use concrete, business-specific language from the research brief.
- Preserve and strengthen the brand voice (tone, CTA style, phrases to use/avoid).
- Vary sentence rhythm; keep plain-language tone for small business owners.
- Preserve SEO structure without keyword stuffing.
- Include FAQ naturally.
- Title and meta description must sound human.
- No fake claims, no guaranteed rankings, no made-up statistics.
- Do not write "as an AI" or similar phrases.`;

/**
 * Humanizer layer — Hermes second pass when available, else deterministic cleanup.
 */
export async function humanizeArticleDraft(
  draft: HermesArticleDraftResult,
  context: {
    brief: ContentResearchBrief;
    website: { url: string; niche: string | null; language: string };
    topic: string;
    targetKeyword: string | null;
    brandVoice?: BrandVoiceProfile | null;
  }
): Promise<HumanizeArticleResult> {
  const humanizedAt = new Date().toISOString();

  if (isHermesConfigured()) {
    try {
      const repaired = await repairArticleDraft({
        website: context.website,
        article: {
          topic: context.topic,
          targetKeyword: context.targetKeyword,
          language: context.website.language,
        },
        currentDraft: draft,
        repairInstructions: [
          HUMANIZER_REPAIR_INSTRUCTIONS,
          buildBrandVoiceHumanizerAddendum(
            context.brandVoice,
            context.website.language
          ),
          `Buyer question: ${context.brief.buyerQuestion}`,
          `Primary keyword: ${context.brief.primaryKeyword}`,
          context.brief.contentGapSummary
            ? `Content gap: ${context.brief.contentGapSummary}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
        issues: [
          "Humanize tone, preserve brand voice, and remove generic AI phrasing",
        ],
      });

      return {
        article: repaired,
        humanizedAt,
        method: "hermes",
      };
    } catch {
      // Fall through to deterministic humanizer.
    }
  }

  return {
    article: humanizeArticleDeterministic(draft, context.brief),
    humanizedAt,
    method: "deterministic",
  };
}
