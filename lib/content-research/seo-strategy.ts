import type {
  CompetitorInsight,
  ContentResearchBrief,
  SearchIntent,
  SeoDemandEvidence,
  SeoEconomicsEstimate,
  SeoPageMapItem,
  SeoStrategyConfidence,
  SeoStrategySnapshot,
} from "./types";
import type { ResearchSourceContext } from "./source-context";

type BuildSeoStrategyInput = {
  context: ResearchSourceContext;
  locale: "en" | "ru" | "et";
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent;
  buyerQuestion: string;
  competitors: CompetitorInsight[];
  competitorsUnavailable: boolean;
  generatedAt?: string;
};

function websiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}

function businessValueForIntent(intent: SearchIntent): "LOW" | "MEDIUM" | "HIGH" {
  if (intent === "TRANSACTIONAL" || intent === "COMMERCIAL" || intent === "LOCAL") {
    return "HIGH";
  }
  if (intent === "COMPARISON") return "MEDIUM";
  return "LOW";
}

function difficultyFromCompetitors(
  competitors: CompetitorInsight[]
): SeoPageMapItem["difficulty"] {
  if (competitors.length >= 5) return "HIGH";
  if (competitors.length >= 2) return "MEDIUM";
  if (competitors.length === 1) return "LOW";
  return "UNKNOWN";
}

function confidenceFromInputs(input: BuildSeoStrategyInput): SeoStrategyConfidence {
  let score = 0;
  if (input.context.gscConnected) score += 3;
  if (input.competitors.length >= 2) score += 2;
  else if (input.competitors.length === 1) score += 1;
  if (input.secondaryKeywords.length >= 2) score += 1;
  if (input.context.opportunities.length > 0) score += 1;
  if (input.context.contentTasks.length > 0 || input.context.auditFindings.length > 0) {
    score += 1;
  }

  if (score >= 5) return "HIGH";
  if (score >= 2) return "MEDIUM";
  return "LOW";
}

function sentence(locale: "en" | "ru" | "et", ru: string, en: string, et: string): string {
  if (locale === "ru") return ru;
  if (locale === "et") return et;
  return en;
}

function buildDemandEvidence(input: BuildSeoStrategyInput): SeoDemandEvidence[] {
  const observedAt = input.generatedAt ?? new Date().toISOString();
  const evidence: SeoDemandEvidence[] = [];

  if (input.context.gscConnected) {
    evidence.push({
      source: "GSC",
      label: sentence(
        input.locale,
        "Search Console подключён",
        "Search Console connected",
        "Search Console on ühendatud"
      ),
      value: sentence(
        input.locale,
        "Используйте реальные показы и клики сайта как главный источник спроса.",
        "Use real impressions and clicks as the primary demand source.",
        "Kasuta päris näitamisi ja klikke peamise nõudluse allikana."
      ),
      locale: input.locale,
      observedAt,
      strength: "HIGH",
    });
  }

  if (input.context.opportunities.length > 0) {
    evidence.push({
      source: "AI_PROMPT",
      label: sentence(input.locale, "Возможности роста", "Growth opportunities", "Kasvuvõimalused"),
      value: `${input.context.opportunities.length} opportunity signal(s) available for topic selection.`,
      locale: input.locale,
      observedAt,
      strength: "MEDIUM",
    });
  }

  if (input.competitors.length > 0) {
    evidence.push({
      source: "COMPETITOR",
      label: sentence(input.locale, "Конкуренты SERP/ниши", "SERP/niche competitors", "SERP/niši konkurendid"),
      value: `${input.competitors.length} competitor signal(s): ${input.competitors
        .slice(0, 3)
        .map((competitor) => competitor.domain)
        .join(", ")}`,
      locale: input.locale,
      observedAt,
      strength: input.competitors.length >= 2 ? "HIGH" : "MEDIUM",
    });
  }

  if (input.context.contentTasks.length > 0) {
    evidence.push({
      source: "TASK",
      label: sentence(input.locale, "Задачи сайта", "Website tasks", "Veebisaidi ülesanded"),
      value: `${input.context.contentTasks.length} content task(s) inform the content angle.`,
      locale: input.locale,
      observedAt,
      strength: "MEDIUM",
    });
  }

  if (input.context.auditFindings.length > 0) {
    evidence.push({
      source: "AUDIT",
      label: sentence(input.locale, "Аудит сайта", "Website audit", "Veebisaidi audit"),
      value: `${input.context.auditFindings.length} priority audit finding(s) considered.`,
      locale: input.locale,
      observedAt,
      strength: "MEDIUM",
    });
  }

  if (evidence.length === 0) {
    evidence.push({
      source: "MANUAL",
      label: sentence(input.locale, "Предварительная гипотеза", "Provisional hypothesis", "Esialgne hüpotees"),
      value: sentence(
        input.locale,
        "Нет измеренных данных спроса; тему нужно подтвердить через Search Console, конкурентов или ручной ввод.",
        "No measured demand data; validate the topic with Search Console, competitors, or manual input.",
        "Mõõdetud nõudluse andmeid pole; kinnita teema Search Console'i, konkurentide või käsitsi sisendiga."
      ),
      locale: input.locale,
      observedAt,
      strength: "LOW",
    });
  }

  return evidence.slice(0, 8);
}

function buildEconomics(input: BuildSeoStrategyInput): SeoEconomicsEstimate {
  const value = businessValueForIntent(input.searchIntent);
  const competitorDifficulty = difficultyFromCompetitors(input.competitors);
  const productionCost = input.competitorsUnavailable ? "MEDIUM" : "LOW";
  const timeToImpact =
    competitorDifficulty === "HIGH"
      ? "LONG"
      : competitorDifficulty === "UNKNOWN"
        ? "UNKNOWN"
        : "MEDIUM";

  return {
    expectedValue: value,
    productionCost,
    timeToImpact,
    rationale: sentence(
      input.locale,
      `Приоритет основан на intent "${input.searchIntent}", наличии доказательств спроса и сложности конкурентов.`,
      `Priority is based on "${input.searchIntent}" intent, demand evidence, and competitor difficulty.`,
      `Prioriteet põhineb intentil "${input.searchIntent}", nõudluse tõenditel ja konkurentide raskusel.`
    ),
  };
}

function buildPageMap(input: BuildSeoStrategyInput, confidence: SeoStrategyConfidence): SeoPageMapItem[] {
  const host = websiteHost(input.context.website.url);
  const pageType: SeoPageMapItem["pageType"] =
    input.searchIntent === "TRANSACTIONAL" || input.searchIntent === "LOCAL"
      ? "SERVICE_PAGE"
      : "ARTICLE";

  return [
    {
      cluster: input.primaryKeyword,
      intent: input.searchIntent,
      primaryQuery: input.primaryKeyword,
      supportingQueries: input.secondaryKeywords.slice(0, 8),
      targetUrl: pageType === "SERVICE_PAGE" ? input.context.website.url : `${input.context.website.url.replace(/\/$/, "")}/blog/`,
      pageType,
      demand: input.context.gscConnected ? "OBSERVED" : "INFERRED",
      difficulty: difficultyFromCompetitors(input.competitors),
      businessValue: businessValueForIntent(input.searchIntent),
      confidence,
      nextAction: sentence(
        input.locale,
        `Создать материал для ${host}, который отвечает на вопрос покупателя: ${input.buyerQuestion}`,
        `Create content for ${host} that answers the buyer question: ${input.buyerQuestion}`,
        `Loo sisu domeenile ${host}, mis vastab ostja küsimusele: ${input.buyerQuestion}`
      ),
    },
  ];
}

export function buildSeoStrategySnapshot(input: BuildSeoStrategyInput): SeoStrategySnapshot {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const confidence = confidenceFromInputs(input);
  const demandEvidence = buildDemandEvidence({ ...input, generatedAt });
  const economics = buildEconomics(input);
  const pageMap = buildPageMap(input, confidence);
  const dataGaps: string[] = [];
  const doNotPublishYet: string[] = [];

  if (!input.context.gscConnected) {
    dataGaps.push(
      sentence(
        input.locale,
        "Нет данных Google Search Console: спрос и страницы-кандидаты пока частично inferred.",
        "No Google Search Console data: demand and target pages are partly inferred.",
        "Google Search Console'i andmeid pole: nõudlus ja sihtlehed on osaliselt tuletatud."
      )
    );
  }

  if (input.competitorsUnavailable || input.competitors.length === 0) {
    dataGaps.push(
      sentence(
        input.locale,
        "Нет подтверждённых SERP-конкурентов: перед масштабированием нужно добавить конкурентов или подключить источник SERP.",
        "No confirmed SERP competitors: add competitors or connect a SERP source before scaling.",
        "Kinnitatud SERP-konkurente pole: enne skaleerimist lisa konkurendid või ühenda SERP-allikas."
      )
    );
  }

  if (confidence === "LOW") {
    doNotPublishYet.push(
      sentence(
        input.locale,
        "Не публиковать автоматически: тема основана на слабых данных и требует подтверждения спроса.",
        "Do not auto-publish: topic evidence is weak and demand must be validated.",
        "Ära avalda automaatselt: teema tõendus on nõrk ja nõudlus tuleb kinnitada."
      )
    );
  }

  return {
    methodologyVersion: "ai-assisted-seo-v1",
    locale: input.locale,
    confidence,
    observations: [
      sentence(
        input.locale,
        `Основной запрос: «${input.primaryKeyword}».`,
        `Primary query: "${input.primaryKeyword}".`,
        `Põhipäring: „${input.primaryKeyword}".`
      ),
      sentence(
        input.locale,
        `Intent: ${input.searchIntent}.`,
        `Intent: ${input.searchIntent}.`,
        `Intent: ${input.searchIntent}.`
      ),
    ],
    assumptions: [
      sentence(
        input.locale,
        "Объёмы и сложность не подставляются без измеренного источника; отсутствующие значения помечены как inferred/unknown.",
        "Volume and difficulty are not invented; missing values are marked inferred/unknown.",
        "Mahtu ja raskust ei leiutata; puuduvad väärtused on märgitud inferred/unknown."
      ),
    ],
    estimates: [
      economics.rationale,
    ],
    recommendations: [
      sentence(
        input.locale,
        "Сначала публиковать темы с HIGH/MEDIUM confidence, затем измерять показы, клики и заявки.",
        "Publish HIGH/MEDIUM confidence topics first, then measure impressions, clicks, and leads.",
        "Avalda esmalt HIGH/MEDIUM kindlusega teemad, seejärel mõõda näitamisi, klikke ja päringuid."
      ),
    ],
    demandEvidence,
    pageMap,
    doNotPublishYet,
    dataGaps,
    economics,
    generatedAt,
  };
}

export function appendSeoStrategyQualityRequirements(
  requirements: string[],
  strategy?: Pick<SeoStrategySnapshot, "confidence" | "dataGaps" | "doNotPublishYet">
): string[] {
  const result = [...requirements];
  result.push("Ground the article in the SEO strategy snapshot: demand evidence, intent, page map, and business value.");
  result.push("Do not invent keyword volume, rankings, testimonials, statistics, or firsthand experience.");
  if (strategy?.confidence === "LOW" || (strategy?.doNotPublishYet.length ?? 0) > 0) {
    result.push("Treat this as provisional: do not auto-publish until demand evidence improves.");
  }
  if ((strategy?.dataGaps.length ?? 0) > 0) {
    result.push("Name data gaps internally; avoid making unsupported certainty claims in the article.");
  }
  return [...new Set(result)];
}

export function hasPublishableSeoEvidence(
  brief: Pick<ContentResearchBrief, "seoStrategy">
): boolean {
  const strategy = brief.seoStrategy;
  if (!strategy) return true;
  return strategy.confidence !== "LOW" && strategy.doNotPublishYet.length === 0;
}
