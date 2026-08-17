import type {
  ContentResearchBrief,
  SeoDemandEvidence,
  SeoPageMapItem,
  SeoStrategyConfidence,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const VALID_SOURCES = new Set([
  "AUTOPILOT_PLAN",
  "MANUAL_ARTICLE",
  "TASK",
  "GSC",
  "AUDIT",
]);

const VALID_INTENTS = new Set([
  "INFORMATIONAL",
  "COMMERCIAL",
  "TRANSACTIONAL",
  "NAVIGATIONAL",
  "LOCAL",
  "COMPARISON",
]);

const VALID_STATUSES = new Set(["DRAFT", "READY_FOR_GENERATION", "BLOCKED"]);

const VALID_PLATFORMS = new Set([
  "CHATGPT",
  "GEMINI",
  "PERPLEXITY",
  "GOOGLE_AI",
  "CLAUDE",
  "GENERIC",
]);

const VALID_EVIDENCE_SOURCES = new Set([
  "GSC",
  "AUDIT",
  "TASK",
  "COMPETITOR",
  "AI_PROMPT",
  "MANUAL",
]);

const VALID_CONFIDENCE = new Set(["LOW", "MEDIUM", "HIGH"]);

function parseSeoStrategy(value: unknown): ContentResearchBrief["seoStrategy"] {
  if (!isRecord(value)) return undefined;
  if (value.methodologyVersion !== "ai-assisted-seo-v1") return undefined;
  const locale: "ru" | "et" | "en" =
    value.locale === "ru" || value.locale === "et" || value.locale === "en"
      ? value.locale
      : "en";
  const confidence =
    typeof value.confidence === "string" && VALID_CONFIDENCE.has(value.confidence)
      ? (value.confidence as SeoStrategyConfidence)
      : "LOW";
  const generatedAt =
    typeof value.generatedAt === "string"
      ? value.generatedAt
      : new Date(0).toISOString();

  const demandEvidence: SeoDemandEvidence[] = Array.isArray(value.demandEvidence)
    ? value.demandEvidence
        .map((item) => {
          if (!isRecord(item)) return null;
          const sourceVal = typeof item.source === "string" ? item.source : null;
          const strength =
            typeof item.strength === "string" && VALID_CONFIDENCE.has(item.strength)
              ? item.strength
              : null;
          if (!sourceVal || !VALID_EVIDENCE_SOURCES.has(sourceVal) || !strength) {
            return null;
          }
          return {
            source: sourceVal as ContentResearchBrief["evidence"][0]["source"],
            label: typeof item.label === "string" ? item.label : "",
            value: typeof item.value === "string" ? item.value : "",
            locale,
            observedAt:
              typeof item.observedAt === "string" ? item.observedAt : generatedAt,
            strength: strength as SeoStrategyConfidence,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  const pageMap: SeoPageMapItem[] = Array.isArray(value.pageMap)
    ? value.pageMap
        .map((item) => {
          if (!isRecord(item)) return null;
          const intent =
            typeof item.intent === "string" && VALID_INTENTS.has(item.intent)
              ? item.intent
              : null;
          const confidenceValue =
            typeof item.confidence === "string" && VALID_CONFIDENCE.has(item.confidence)
              ? item.confidence
              : "LOW";
          if (!intent) return null;
          const pageType: SeoPageMapItem["pageType"] =
            item.pageType === "SERVICE_PAGE" ||
            item.pageType === "CATEGORY_PAGE" ||
            item.pageType === "FIX_EXISTING_PAGE"
              ? item.pageType
              : "ARTICLE";
          const demand: SeoPageMapItem["demand"] =
            item.demand === "OBSERVED" || item.demand === "UNKNOWN"
              ? item.demand
              : "INFERRED";
          const difficulty: SeoPageMapItem["difficulty"] =
            item.difficulty === "LOW" ||
            item.difficulty === "MEDIUM" ||
            item.difficulty === "HIGH"
              ? item.difficulty
              : "UNKNOWN";
          const businessValue: SeoPageMapItem["businessValue"] =
            item.businessValue === "LOW" || item.businessValue === "MEDIUM"
              ? item.businessValue
              : "HIGH";
          return {
            cluster: typeof item.cluster === "string" ? item.cluster : "",
            intent: intent as ContentResearchBrief["searchIntent"],
            primaryQuery:
              typeof item.primaryQuery === "string" ? item.primaryQuery : "",
            supportingQueries: parseStringArray(item.supportingQueries),
            targetUrl: typeof item.targetUrl === "string" ? item.targetUrl : "",
            pageType,
            demand,
            difficulty,
            businessValue,
            confidence: confidenceValue as SeoStrategyConfidence,
            nextAction:
              typeof item.nextAction === "string" ? item.nextAction : "",
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  const economicsValue = isRecord(value.economics) ? value.economics : {};

  return {
    methodologyVersion: "ai-assisted-seo-v1",
    locale,
    confidence,
    observations: parseStringArray(value.observations),
    assumptions: parseStringArray(value.assumptions),
    estimates: parseStringArray(value.estimates),
    recommendations: parseStringArray(value.recommendations),
    demandEvidence,
    pageMap,
    doNotPublishYet: parseStringArray(value.doNotPublishYet),
    dataGaps: parseStringArray(value.dataGaps),
    economics: {
      expectedValue:
        economicsValue.expectedValue === "LOW" ||
        economicsValue.expectedValue === "MEDIUM"
          ? economicsValue.expectedValue
          : "HIGH",
      productionCost:
        economicsValue.productionCost === "HIGH" ||
        economicsValue.productionCost === "MEDIUM"
          ? economicsValue.productionCost
          : "LOW",
      timeToImpact:
        economicsValue.timeToImpact === "SHORT" ||
        economicsValue.timeToImpact === "MEDIUM" ||
        economicsValue.timeToImpact === "LONG"
          ? economicsValue.timeToImpact
          : "UNKNOWN",
      rationale:
        typeof economicsValue.rationale === "string"
          ? economicsValue.rationale
          : "",
    },
    generatedAt,
  };
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function parseSerpResearch(value: unknown): ContentResearchBrief["serpResearch"] {
  if (!isRecord(value) || value.provider !== "SERPER") return undefined;
  const query = typeof value.query === "string" ? value.query : "";
  const observedAt = typeof value.observedAt === "string" ? value.observedAt : "";
  if (!query || !observedAt) return undefined;
  const topPages = Array.isArray(value.topPages)
    ? value.topPages.flatMap((item) => {
        if (!isRecord(item) || typeof item.url !== "string" || typeof item.title !== "string") return [];
        return [{
          position: typeof item.position === "number" ? item.position : 0,
          title: item.title,
          url: item.url,
          snippet: typeof item.snippet === "string" ? item.snippet : "",
          headings: parseStringArray(item.headings),
        }];
      })
    : [];
  return {
    provider: "SERPER",
    query,
    observedAt,
    available: value.available === true,
    unavailableReason: typeof value.unavailableReason === "string" ? value.unavailableReason : undefined,
    topPages,
    relatedQuestions: parseStringArray(value.relatedQuestions),
    commonHeadings: parseStringArray(value.commonHeadings),
    entities: parseStringArray(value.entities),
  };
}

export function parseContentResearchBrief(
  value: unknown
): ContentResearchBrief | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "string" ? value.id : null;
  const websiteId = typeof value.websiteId === "string" ? value.websiteId : null;
  const organizationId =
    typeof value.organizationId === "string" ? value.organizationId : null;
  const source = typeof value.source === "string" ? value.source : null;
  const primaryKeyword =
    typeof value.primaryKeyword === "string" ? value.primaryKeyword : "";
  const buyerQuestion =
    typeof value.buyerQuestion === "string" ? value.buyerQuestion : "";
  const status = typeof value.status === "string" ? value.status : "DRAFT";
  const generatedAt =
    typeof value.generatedAt === "string" ? value.generatedAt : null;

  if (
    !id ||
    !websiteId ||
    !organizationId ||
    !source ||
    !VALID_SOURCES.has(source) ||
    !generatedAt
  ) {
    return null;
  }

  const searchIntent =
    typeof value.searchIntent === "string" &&
    VALID_INTENTS.has(value.searchIntent)
      ? (value.searchIntent as ContentResearchBrief["searchIntent"])
      : "INFORMATIONAL";

  const riskLevel =
    value.riskLevel === "LOW" ||
    value.riskLevel === "MEDIUM" ||
    value.riskLevel === "HIGH"
      ? value.riskLevel
      : "MEDIUM";

  const geoPrompts = Array.isArray(value.geoPrompts)
    ? value.geoPrompts
        .map((item) => {
          if (!isRecord(item)) return null;
          const prompt = typeof item.prompt === "string" ? item.prompt : null;
          const platform =
            typeof item.platform === "string" ? item.platform : null;
          const desiredMentionAngle =
            typeof item.desiredMentionAngle === "string"
              ? item.desiredMentionAngle
              : "";
          if (!prompt || !platform || !VALID_PLATFORMS.has(platform)) {
            return null;
          }
          return {
            prompt,
            platform: platform as ContentResearchBrief["geoPrompts"][0]["platform"],
            desiredMentionAngle,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  const competitors = Array.isArray(value.competitors)
    ? value.competitors
        .map((item) => {
          if (!isRecord(item)) return null;
          const domain = typeof item.domain === "string" ? item.domain : null;
          const name = typeof item.name === "string" ? item.name : null;
          const reason = typeof item.reason === "string" ? item.reason : "";
          if (!domain || !name) return null;
          return {
            domain,
            name,
            reason,
            observedStrengths: parseStringArray(item.observedStrengths),
            contentAngles: parseStringArray(item.contentAngles),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  const evidence = Array.isArray(value.evidence)
    ? value.evidence
        .map((item) => {
          if (!isRecord(item)) return null;
          const sourceVal =
            typeof item.source === "string" ? item.source : null;
          const label = typeof item.label === "string" ? item.label : null;
          const val = typeof item.value === "string" ? item.value : null;
          if (!sourceVal || !label || !val || !VALID_EVIDENCE_SOURCES.has(sourceVal)) {
            return null;
          }
          return {
            source: sourceVal as ContentResearchBrief["evidence"][0]["source"],
            label,
            value: val,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  return {
    id,
    websiteId,
    organizationId,
    source: source as ContentResearchBrief["source"],
    targetUrl:
      typeof value.targetUrl === "string" ? value.targetUrl : undefined,
    targetPage:
      typeof value.targetPage === "string" ? value.targetPage : undefined,
    primaryKeyword,
    secondaryKeywords: parseStringArray(value.secondaryKeywords),
    searchIntent,
    buyerQuestion,
    geoPrompts,
    competitors,
    competitorsUnavailable: Boolean(value.competitorsUnavailable),
    contentGapSummary:
      typeof value.contentGapSummary === "string"
        ? value.contentGapSummary
        : "",
    recommendedArticleTitle:
      typeof value.recommendedArticleTitle === "string"
        ? value.recommendedArticleTitle
        : "",
    outline: parseStringArray(value.outline),
    faq: parseStringArray(value.faq),
    internalLinkSuggestions: parseStringArray(value.internalLinkSuggestions),
    schemaSuggestions: parseStringArray(value.schemaSuggestions),
    llmsTxtSuggestion:
      typeof value.llmsTxtSuggestion === "string"
        ? value.llmsTxtSuggestion
        : undefined,
    aiReadableSummarySuggestion:
      typeof value.aiReadableSummarySuggestion === "string"
        ? value.aiReadableSummarySuggestion
        : undefined,
    evidence,
    serpResearch: parseSerpResearch(value.serpResearch),
    seoStrategy: parseSeoStrategy(value.seoStrategy),
    qualityRequirements: parseStringArray(value.qualityRequirements),
    riskLevel,
    status: VALID_STATUSES.has(status)
      ? (status as ContentResearchBrief["status"])
      : "DRAFT",
    blockedReason:
      typeof value.blockedReason === "string" ? value.blockedReason : undefined,
    generatedAt,
    hermesEnhanced: Boolean(value.hermesEnhanced),
  };
}

export function briefToJson(
  brief: ContentResearchBrief
): Record<string, unknown> {
  return { ...brief };
}
