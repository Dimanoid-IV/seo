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
