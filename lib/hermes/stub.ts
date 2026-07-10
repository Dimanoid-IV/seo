import "server-only";

import type {
  HermesGenerateRecommendationsInput,
  HermesGenerateTaskFixInput,
  HermesRecommendationsResult,
  HermesTaskPreparedFixResult,
} from "./types";

/**
 * Development-only stub. Responses are clearly marked with metadata.stub=true.
 * Never used in production.
 */
export async function generateRecommendationsStub(
  input: HermesGenerateRecommendationsInput
): Promise<HermesRecommendationsResult> {
  const limited = input.context.basedOnLimitedData;
  const limitedNote = limited
    ? input.locale === "ru"
      ? " (на основе ограниченных данных)"
      : input.locale === "et"
        ? " (piiratud andmete põhjal)"
        : " (based on limited data)"
    : "";

  if (input.type === "content_brief") {
    return {
      title:
        input.locale === "ru"
          ? "Черновик контент-брифа"
          : input.locale === "et"
            ? "Sisu briifi mustand"
            : "Content brief draft",
      summary:
        input.locale === "ru"
          ? `Подготовлен обзор темы для ${input.website.url}${limitedNote}. Требует проверки.`
          : input.locale === "et"
            ? `Teema ülevaade saidile ${input.website.url}${limitedNote}. Vajab ülevaatust.`
            : `Topic overview for ${input.website.url}${limitedNote}. Needs review.`,
      items: [
        {
          title:
            input.locale === "ru"
              ? "Статья: ключевые вопросы клиентов"
              : input.locale === "et"
                ? "Artikkel: klientide peamised küsimused"
                : "Article: customer questions to answer",
          description:
            input.locale === "ru"
              ? "Опишите типичные вопросы клиентов и дайте практичные ответы."
              : input.locale === "et"
                ? "Kirjeldage tüüpilisi klientide küsimusi ja pakkuge praktilisi vastuseid."
                : "Cover common customer questions with practical answers.",
          priority: "MEDIUM",
          category: "CONTENT",
          topic: "Customer FAQ guide",
          targetKeyword: "local service FAQ",
          outline: ["Introduction", "Top 5 questions", "Next steps"],
          basedOnLimitedData: limited,
        },
      ],
      metadata: { provider: "hermes-stub", stub: true },
    };
  }

  if (input.type === "monthly_plan") {
    return {
      title:
        input.locale === "ru"
          ? "Черновик месячного плана"
          : input.locale === "et"
            ? "Kuise plaani mustand"
            : "Monthly plan draft",
      summary:
        input.locale === "ru"
          ? `Предложения роста на месяц для ${input.website.url}${limitedNote}.`
          : input.locale === "et"
            ? `Kasvusoovitused kuuks saidile ${input.website.url}${limitedNote}.`
            : `Growth suggestions for the month for ${input.website.url}${limitedNote}.`,
      items: [
        {
          title:
            input.locale === "ru"
              ? "Улучшить ключевые посадочные страницы"
              : input.locale === "et"
                ? "Paranda peamisi sihtlehti"
                : "Improve key landing pages",
          description:
            input.locale === "ru"
              ? "Обновите заголовки, мета-описания и структуру на главных страницах."
              : input.locale === "et"
                ? "Uuenda pealkirju, meta kirjeldusi ja struktuuri peamistel lehtedel."
                : "Refresh titles, meta descriptions, and structure on top pages.",
          priority: "HIGH",
          category: "CONTENT",
          basedOnLimitedData: limited,
        },
      ],
      metadata: { provider: "hermes-stub", stub: true },
    };
  }

  return {
    title:
      input.locale === "ru"
        ? "Черновые SEO-рекомендации"
        : input.locale === "et"
          ? "SEO soovituste mustand"
          : "Draft SEO recommendations",
    summary:
      input.locale === "ru"
        ? `Подготовлены задачи для ${input.website.url}${limitedNote}. Требуют проверки перед выполнением.`
        : input.locale === "et"
          ? `Ülesanded saidile ${input.website.url}${limitedNote}. Vajavad enne teostamist ülevaatust.`
          : `Suggested tasks for ${input.website.url}${limitedNote}. Review before acting.`,
    items: [
      {
        title:
          input.locale === "ru"
            ? "Проверить мета-заголовки главных страниц"
            : input.locale === "et"
              ? "Kontrolli peamiste lehtede meta pealkirju"
              : "Review meta titles on key pages",
        description:
          input.locale === "ru"
            ? "Убедитесь, что заголовки отражают услуги и содержат локальные ключевые слова."
            : input.locale === "et"
              ? "Veendu, et pealkirjad kajastavad teenuseid ja sisaldavad kohalikke märksõnu."
              : "Ensure titles reflect services and include relevant local keywords.",
        priority: "HIGH",
        category: "CONTENT",
        rationale:
          input.locale === "ru"
            ? "Улучшает кликабельность в поиске."
            : input.locale === "et"
              ? "Parandab otsingus klõpsimisi."
              : "Improves click-through in search results.",
        basedOnLimitedData: limited,
      },
      {
        title:
          input.locale === "ru"
            ? "Добавить страницу с ответами на частые вопросы"
            : input.locale === "et"
              ? "Lisa KKK leht"
              : "Add an FAQ page",
        description:
          input.locale === "ru"
            ? "Соберите 5–7 вопросов клиентов и дайте короткие ответы."
            : input.locale === "et"
              ? "Kogu 5–7 kliendi küsimust ja anna lühikesed vastused."
              : "Collect 5–7 customer questions and provide concise answers.",
        priority: "MEDIUM",
        category: "CONTENT",
        basedOnLimitedData: limited,
      },
    ],
    metadata: { provider: "hermes-stub", stub: true },
  };
}

export async function generateTaskPreparedFixStub(
  input: HermesGenerateTaskFixInput
): Promise<HermesTaskPreparedFixResult> {
  const isMetaTitle = input.task.auditCheckCode?.toLowerCase().startsWith("title_");
  const isMetaDescription = input.task.auditCheckCode
    ?.toLowerCase()
    .startsWith("meta_description_");

  const proposedFix =
    input.task.recommendation?.trim() ||
    input.task.description?.trim() ||
    input.task.title;

  const title =
    input.locale === "ru"
      ? isMetaTitle
        ? "Подготовленный meta title"
        : isMetaDescription
          ? "Подготовленное meta description"
          : `Подготовленное исправление: ${input.task.title}`
      : input.locale === "et"
        ? isMetaTitle
          ? "Ettevalmistatud meta pealkiri"
          : isMetaDescription
            ? "Ettevalmistatud meta kirjeldus"
            : `Ettevalmistatud parandus: ${input.task.title}`
        : isMetaTitle
          ? "Prepared meta title"
          : isMetaDescription
            ? "Prepared meta description"
            : `Prepared fix: ${input.task.title}`;

  return {
    title,
    summary:
      input.locale === "ru"
        ? `Черновик исправления для ${input.website.url}. Требует проверки.`
        : input.locale === "et"
          ? `Paranduse mustand saidile ${input.website.url}. Vajab ülevaatust.`
          : `Draft fix for ${input.website.url}. Needs review.`,
    proposedFix: isMetaTitle
      ? input.task.title.replace(/^Fix\s+/i, "").slice(0, 60)
      : isMetaDescription
        ? proposedFix.slice(0, 155)
        : proposedFix,
    whyItMatters:
      input.task.whyItMatters?.trim() ||
      (input.locale === "ru"
        ? "Это улучшит видимость сайта в поиске."
        : input.locale === "et"
          ? "See parandab saidi nähtavust otsingus."
          : "This improves how your site appears in search."),
    implementationNotes:
      input.locale === "ru"
        ? "Проверьте текст и примените изменение в CMS или на сайте вручную."
        : input.locale === "et"
          ? "Kontrolli teksti ja rakenda muudatus CMS-is või saidil käsitsi."
          : "Review the text and apply the change in your CMS or website manually.",
    riskLevel: "low",
    requiresIntegration: "manual",
    approvalRequired: true,
    metadata: { provider: "hermes-stub", stub: true },
  };
}
