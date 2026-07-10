export type HermesArticleConstraints = {
  noFakeClaims: boolean;
  noGuaranteedRankings: boolean;
  writeForSmallBusinessOwner: boolean;
  includeFaq: boolean;
  includeMeta: boolean;
};

export type HermesGenerateArticleInput = {
  website: {
    url: string;
    niche: string | null;
    language: string;
  };
  task?: {
    title: string;
    description: string | null;
    recommendationJson: unknown;
  };
  article: {
    topic: string;
    targetKeyword: string | null;
    language: string;
  };
  constraints: HermesArticleConstraints;
};

export type HermesRepairArticleInput = {
  website: {
    url: string;
    niche: string | null;
    language: string;
  };
  article: {
    topic: string;
    targetKeyword: string | null;
    language: string;
  };
  currentDraft: HermesArticleDraftResult;
  repairInstructions: string;
  issues: string[];
};

export type HermesArticleDraftResult = {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  contentHtml: string;
  faqJson: unknown;
  schemaJson: unknown;
  metadata?: {
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costCents?: number;
    externalJobId?: string;
  };
};

export type HermesJobPayload = {
  jobType: string;
  params: Record<string, unknown>;
  idempotencyKey?: string;
};

export type HermesJobStatusResult = {
  id: string;
  status: string;
  result?: HermesArticleDraftResult;
  error?: string;
};

export type HermesSocialPostConstraints = {
  noFakeClaims: boolean;
  noAutoPublishLanguage: boolean;
  platformSpecificTone: boolean;
};

export type HermesGenerateSocialPostInput = {
  website: {
    url: string;
    niche: string | null;
    language: string;
  };
  platform: string;
  source: {
    type: string;
    context: Record<string, unknown>;
  };
  constraints: HermesSocialPostConstraints;
};

export type HermesSocialPostDraftResult = {
  title: string;
  text: string;
  hook?: string | null;
  hashtags?: string[];
  cta?: string | null;
  metadata?: {
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costCents?: number;
    externalJobId?: string;
  };
};

export type HermesRecommendationType = "seo_tasks" | "content_brief" | "monthly_plan";

export type HermesRecommendationItem = {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?: string;
  rationale?: string;
  basedOnLimitedData?: boolean;
  topic?: string;
  targetKeyword?: string;
  outline?: string[];
};

export type HermesGenerateRecommendationsInput = {
  type: HermesRecommendationType;
  locale: "en" | "ru" | "et";
  website: {
    url: string;
    name: string | null;
    niche: string | null;
    language: string;
  };
  context: {
    hasAudit: boolean;
    hasGsc: boolean;
    growthScore: number | null;
    basedOnLimitedData: boolean;
    auditFindings?: Array<{ title: string; category: string; severity: string }>;
    gscSummary?: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    } | null;
    openTasksCount: number;
    opportunities?: Array<{ title: string; type: string }>;
  };
  constraints: Record<string, unknown>;
  systemInstructions: string;
  model?: string | null;
};

export type HermesRecommendationsResult = {
  title: string;
  summary: string;
  items: HermesRecommendationItem[];
  metadata?: {
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costCents?: number;
    stub?: boolean;
  };
};

export type HermesConnectionStatus = {
  configured: boolean;
  testMode: boolean;
  model: string | null;
  connectionOk: boolean | null;
  connectionError: string | null;
};

export type HermesTaskFixIntegrationRequirement =
  | "none"
  | "wordpress"
  | "gsc"
  | "manual";

export type HermesTaskFixRiskLevel = "low" | "medium" | "high";

export type HermesGenerateTaskFixInput = {
  locale: "en" | "ru" | "et";
  website: {
    url: string;
    name: string | null;
    niche: string | null;
    language: string;
  };
  task: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    priority: string;
    source: string;
    auditCheckCode: string | null;
    whyItMatters: string | null;
    recommendation: string | null;
    pageUrl: string | null;
  };
  integrations: {
    gscConnected: boolean;
    gscPropertySelected: boolean;
    wordpressConnected: boolean;
  };
  constraints: Record<string, unknown>;
  systemInstructions: string;
  model?: string | null;
};

export type HermesTaskPreparedFixResult = {
  title: string;
  summary: string;
  proposedFix: string;
  whyItMatters: string;
  implementationNotes: string;
  riskLevel: HermesTaskFixRiskLevel;
  requiresIntegration: HermesTaskFixIntegrationRequirement;
  approvalRequired: boolean;
  metadata?: {
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costCents?: number;
    stub?: boolean;
  };
};
