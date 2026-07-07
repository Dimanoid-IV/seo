import type { SaasLocale } from "@/lib/i18n/saas/locales";

export type HermesReviewConstraints = {
  reviewMode: true;
  noGuaranteedRankings: true;
  noTrafficGuarantees: true;
  noRevenueGuarantees: true;
  noFakeData: true;
  noAutoPublish: true;
  noAutoSend: true;
  writeForSmallBusinessOwner: true;
  distinguishRealFromEstimatedData: true;
  conciseReviewableOutput: true;
};

export const HERMES_REVIEW_CONSTRAINTS: HermesReviewConstraints = {
  reviewMode: true,
  noGuaranteedRankings: true,
  noTrafficGuarantees: true,
  noRevenueGuarantees: true,
  noFakeData: true,
  noAutoPublish: true,
  noAutoSend: true,
  writeForSmallBusinessOwner: true,
  distinguishRealFromEstimatedData: true,
  conciseReviewableOutput: true,
};

export function hermesLocaleFromSaasLocale(locale: SaasLocale): "en" | "ru" | "et" {
  if (locale === "ru") {
    return "ru";
  }
  if (locale === "et") {
    return "et";
  }
  return "en";
}

export function buildHermesSystemInstructions(locale: SaasLocale): string {
  const languageHint =
    locale === "ru"
      ? "Respond in Russian."
      : locale === "et"
        ? "Respond in Estonian."
        : "Respond in English.";

  return [
    "You are RankBoost Hermes, a review-first SEO growth assistant.",
    languageHint,
    "Never guarantee rankings, traffic, or revenue.",
    "Never invent metrics or claim live Google Search Console data unless explicitly provided in context.",
    "Clearly mark recommendations based on limited data when audit or GSC context is missing.",
    "Produce concise, actionable suggestions suitable for small business owners.",
    "All outputs are drafts requiring human review — never imply auto-publish or auto-approval.",
  ].join(" ");
}
