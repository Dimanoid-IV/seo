import { AppError, ErrorCode } from "@/lib/errors";
import { safeLogError } from "@/lib/logging";
import { assertServerOnly } from "@/lib/security";

import {
  canUseHermesStub,
  getHermesEnvConfig,
  isHermesConfigured,
} from "./config";
import { generateRecommendationsStub, generateTaskPreparedFixStub } from "./stub";
import type {
  HermesArticleDraftResult,
  HermesConnectionStatus,
  HermesGenerateArticleInput,
  HermesGenerateRecommendationsInput,
  HermesGenerateSocialPostInput,
  HermesGenerateTaskFixInput,
  HermesJobPayload,
  HermesJobStatusResult,
  HermesRecommendationItem,
  HermesRecommendationsResult,
  HermesRepairArticleInput,
  HermesSocialPostDraftResult,
  HermesTaskFixIntegrationRequirement,
  HermesTaskFixRiskLevel,
  HermesTaskPreparedFixResult,
} from "./types";

const DEFAULT_CONSTRAINTS = {
  noFakeClaims: true,
  noGuaranteedRankings: true,
  writeForSmallBusinessOwner: true,
  includeFaq: true,
  includeMeta: true,
} as const;

const SAFE_HERMES_UNAVAILABLE =
  "AI generation is temporarily unavailable. Please try again later.";

export { isHermesConfigured } from "./config";

function requireHermesConfig() {
  assertServerOnly();
  const config = getHermesEnvConfig();

  if (!config.apiUrl || !config.apiSecret) {
    throw new AppError(ErrorCode.HERMES_UNAVAILABLE, SAFE_HERMES_UNAVAILABLE);
  }

  return {
    apiUrl: config.apiUrl,
    apiSecret: config.apiSecret,
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
    model: config.model,
  };
}

function parseHermesError(statusCode: number): AppError {
  safeLogError("hermes.response", new Error(`HTTP ${statusCode}`), {
    status: statusCode,
  });

  if (statusCode === 401 || statusCode === 403) {
    return new AppError(ErrorCode.HERMES_UNAVAILABLE, SAFE_HERMES_UNAVAILABLE, {
      details: { reason: "unauthorized" },
    });
  }

  if (statusCode === 429) {
    return new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, SAFE_HERMES_UNAVAILABLE, {
      details: { reason: "rate_limit" },
    });
  }

  if (statusCode >= 500) {
    return new AppError(ErrorCode.HERMES_UNAVAILABLE, SAFE_HERMES_UNAVAILABLE, {
      details: { reason: "upstream_error" },
    });
  }

  return new AppError(ErrorCode.HERMES_UNAVAILABLE, SAFE_HERMES_UNAVAILABLE, {
    details: { reason: "bad_response" },
  });
}

function validateArticleDraftResult(data: unknown): HermesArticleDraftResult {
  if (!data || typeof data !== "object") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes returned an unexpected article response."
    );
  }

  const record = data as Record<string, unknown>;
  const requiredStringFields = [
    "title",
    "slug",
    "metaTitle",
    "metaDescription",
    "contentHtml",
  ] as const;

  for (const field of requiredStringFields) {
    if (typeof record[field] !== "string" || record[field].trim() === "") {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Hermes returned an incomplete article response (${field}).`
      );
    }
  }

  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as HermesArticleDraftResult["metadata"])
      : undefined;

  return {
    title: record.title as string,
    slug: record.slug as string,
    metaTitle: record.metaTitle as string,
    metaDescription: record.metaDescription as string,
    contentHtml: record.contentHtml as string,
    faqJson: record.faqJson ?? null,
    schemaJson: record.schemaJson ?? null,
    metadata,
  };
}

function validateRecommendationItem(data: unknown): HermesRecommendationItem | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.title !== "string" || record.title.trim() === "") {
    return null;
  }
  if (typeof record.description !== "string" || record.description.trim() === "") {
    return null;
  }

  const priorityRaw =
    typeof record.priority === "string" ? record.priority.toUpperCase() : "MEDIUM";
  const priority =
    priorityRaw === "CRITICAL" ||
    priorityRaw === "HIGH" ||
    priorityRaw === "MEDIUM" ||
    priorityRaw === "LOW"
      ? priorityRaw
      : "MEDIUM";

  return {
    title: record.title.trim(),
    description: record.description.trim(),
    priority,
    category: typeof record.category === "string" ? record.category : undefined,
    rationale: typeof record.rationale === "string" ? record.rationale : undefined,
    basedOnLimitedData:
      typeof record.basedOnLimitedData === "boolean"
        ? record.basedOnLimitedData
        : undefined,
    topic: typeof record.topic === "string" ? record.topic : undefined,
    targetKeyword:
      typeof record.targetKeyword === "string" ? record.targetKeyword : undefined,
    outline: Array.isArray(record.outline)
      ? record.outline.filter((line): line is string => typeof line === "string")
      : undefined,
  };
}

function validateRecommendationsResult(data: unknown): HermesRecommendationsResult {
  if (!data || typeof data !== "object") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes returned an unexpected recommendations response."
    );
  }

  const record = data as Record<string, unknown>;
  const title =
    typeof record.title === "string" && record.title.trim()
      ? record.title.trim()
      : "Draft recommendations";
  const summary =
    typeof record.summary === "string" && record.summary.trim()
      ? record.summary.trim()
      : title;

  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items = rawItems
    .map((item) => validateRecommendationItem(item))
    .filter((item): item is HermesRecommendationItem => item !== null);

  if (items.length === 0) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes returned recommendations without usable items."
    );
  }

  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as HermesRecommendationsResult["metadata"])
      : undefined;

  return { title, summary, items, metadata };
}

async function hermesFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { apiUrl, apiSecret, timeoutMs, maxRetries } = requireHermesConfig();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiSecret}`,
          ...(init?.headers ?? {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      if (!response.ok) {
        throw parseHermesError(response.status);
      }

      return body as T;
    } catch (error) {
      lastError = error;
      if (error instanceof AppError) {
        if (attempt >= maxRetries) {
          throw error;
        }
        continue;
      }

      safeLogError("hermes.fetch", error, { path, attempt });
      if (attempt >= maxRetries) {
        const message =
          error instanceof Error && error.name === "TimeoutError"
            ? SAFE_HERMES_UNAVAILABLE
            : SAFE_HERMES_UNAVAILABLE;
        throw new AppError(ErrorCode.HERMES_UNAVAILABLE, message, {
          details: {
            reason:
              error instanceof Error && error.name === "TimeoutError"
                ? "timeout"
                : "network",
          },
        });
      }
    }
  }

  throw lastError instanceof AppError
    ? lastError
    : new AppError(ErrorCode.HERMES_UNAVAILABLE, SAFE_HERMES_UNAVAILABLE);
}

/** Returns Hermes configuration status without exposing secrets. */
export async function getHermesConnectionStatus(options?: {
  testConnection?: boolean;
}): Promise<HermesConnectionStatus> {
  assertServerOnly();
  const config = getHermesEnvConfig();
  const configured = isHermesConfigured();

  if (!configured) {
    return {
      configured: false,
      testMode: config.testMode,
      model: config.model,
      connectionOk: null,
      connectionError: null,
    };
  }

  if (!options?.testConnection) {
    return {
      configured: true,
      testMode: config.testMode,
      model: config.model,
      connectionOk: null,
      connectionError: null,
    };
  }

  try {
    const { apiUrl, apiSecret, timeoutMs } = requireHermesConfig();
    const response = await fetch(`${apiUrl}/v1/health`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiSecret}` },
      signal: AbortSignal.timeout(Math.min(timeoutMs, 10_000)),
    });

    if (!response.ok) {
      return {
        configured: true,
        testMode: config.testMode,
        model: config.model,
        connectionOk: false,
        connectionError: "health_check_failed",
      };
    }

    return {
      configured: true,
      testMode: config.testMode,
      model: config.model,
      connectionOk: true,
      connectionError: null,
    };
  } catch {
    return {
      configured: true,
      testMode: config.testMode,
      model: config.model,
      connectionOk: false,
      connectionError: "health_check_failed",
    };
  }
}

/**
 * Creates a generic Hermes job.
 */
export async function createHermesJob(payload: HermesJobPayload) {
  return hermesFetch<{ id: string; status: string }>("/v1/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Returns Hermes job status (optional polling helper).
 */
export async function getHermesJobStatus(
  jobId: string
): Promise<HermesJobStatusResult> {
  return hermesFetch<HermesJobStatusResult>(`/v1/jobs/${encodeURIComponent(jobId)}`);
}

/**
 * Synchronously generates review-first recommendations via Hermes.
 */
export async function generateRecommendations(
  input: HermesGenerateRecommendationsInput
): Promise<HermesRecommendationsResult> {
  if (canUseHermesStub()) {
    return generateRecommendationsStub(input);
  }

  const config = getHermesEnvConfig();
  const payload = {
    ...input,
    model: input.model ?? config.model ?? undefined,
    constraints: input.constraints,
  };

  const response = await hermesFetch<{ data?: unknown } & Record<string, unknown>>(
    "/v1/generate/recommendations",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const result =
    response.data && typeof response.data === "object"
      ? response.data
      : response;

  return validateRecommendationsResult(result);
}

/**
 * Synchronously generates an article draft via Hermes.
 */
export async function generateArticleDraft(
  input: HermesGenerateArticleInput
): Promise<HermesArticleDraftResult> {
  const payload: HermesGenerateArticleInput = {
    ...input,
    constraints: {
      ...DEFAULT_CONSTRAINTS,
      ...input.constraints,
    },
  };

  const response = await hermesFetch<{ data?: unknown } & Record<string, unknown>>(
    "/v1/generate/article",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const result =
    response.data && typeof response.data === "object"
      ? response.data
      : response;

  return validateArticleDraftResult(result);
}

/**
 * Repairs an existing article draft via Hermes (targeted fixes, not full rewrite).
 */
export async function repairArticleDraft(
  input: HermesRepairArticleInput
): Promise<HermesArticleDraftResult> {
  const response = await hermesFetch<{ data?: unknown } & Record<string, unknown>>(
    "/v1/generate/article/repair",
    {
      method: "POST",
      body: JSON.stringify({
        website: input.website,
        article: input.article,
        currentDraft: input.currentDraft,
        repairInstructions: input.repairInstructions,
        issues: input.issues,
        constraints: DEFAULT_CONSTRAINTS,
      }),
    }
  );

  const result =
    response.data && typeof response.data === "object"
      ? response.data
      : response;

  return validateArticleDraftResult(result);
}

function validateSocialPostDraftResult(
  data: unknown
): HermesSocialPostDraftResult {
  if (!data || typeof data !== "object") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes returned an unexpected social post response."
    );
  }

  const record = data as Record<string, unknown>;

  if (typeof record.title !== "string" || record.title.trim() === "") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes returned an incomplete social post (title)."
    );
  }

  const text =
    typeof record.text === "string"
      ? record.text
      : typeof record.content === "string"
        ? record.content
        : null;

  if (!text || text.trim() === "") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes returned an incomplete social post (text)."
    );
  }

  const hashtags = Array.isArray(record.hashtags)
    ? record.hashtags.filter((tag): tag is string => typeof tag === "string")
    : [];

  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as HermesSocialPostDraftResult["metadata"])
      : undefined;

  return {
    title: record.title,
    text,
    hook: typeof record.hook === "string" ? record.hook : null,
    hashtags,
    cta: typeof record.cta === "string" ? record.cta : null,
    metadata,
  };
}

/**
 * Synchronously generates a social post draft via Hermes.
 */
export async function generateSocialPostDraft(
  input: HermesGenerateSocialPostInput
): Promise<HermesSocialPostDraftResult> {
  const payload: HermesGenerateSocialPostInput = {
    ...input,
    constraints: {
      ...input.constraints,
      noFakeClaims: true,
      noAutoPublishLanguage: true,
      platformSpecificTone: true,
    },
  };

  const response = await hermesFetch<{ data?: unknown } & Record<string, unknown>>(
    "/v1/generate/social-post",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const result =
    response.data && typeof response.data === "object"
      ? response.data
      : response;

  return validateSocialPostDraftResult(result);
}

function parseRiskLevel(value: unknown): HermesTaskFixRiskLevel {
  if (value === "medium" || value === "high") {
    return value;
  }
  return "low";
}

function parseIntegrationRequirement(
  value: unknown
): HermesTaskFixIntegrationRequirement {
  if (
    value === "wordpress" ||
    value === "gsc" ||
    value === "manual" ||
    value === "none"
  ) {
    return value;
  }
  return "manual";
}

function extractJsonObjectFromText(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through
    }
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      return null;
    }
  }

  return null;
}

function validateTaskPreparedFixResult(data: unknown): HermesTaskPreparedFixResult {
  let record: Record<string, unknown> | null =
    data && typeof data === "object" ? (data as Record<string, unknown>) : null;

  if (!record && typeof data === "string") {
    record = extractJsonObjectFromText(data) as Record<string, unknown> | null;
  }

  if (!record) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes returned an unexpected task fix response."
    );
  }

  const proposedFix =
    typeof record.proposedFix === "string"
      ? record.proposedFix.trim()
      : typeof record.suggestedValue === "string"
        ? record.suggestedValue.trim()
        : typeof record.content === "string"
          ? record.content.trim()
          : "";

  if (!proposedFix) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes returned a task fix without proposed content."
    );
  }

  const title =
    typeof record.title === "string" && record.title.trim()
      ? record.title.trim()
      : "Prepared fix";
  const summary =
    typeof record.summary === "string" && record.summary.trim()
      ? record.summary.trim()
      : proposedFix.slice(0, 180);
  const whyItMatters =
    typeof record.whyItMatters === "string" && record.whyItMatters.trim()
      ? record.whyItMatters.trim()
      : summary;
  const implementationNotes =
    typeof record.implementationNotes === "string" &&
    record.implementationNotes.trim()
      ? record.implementationNotes.trim()
      : "Review this draft and apply it manually on your website.";

  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as HermesTaskPreparedFixResult["metadata"])
      : undefined;

  return {
    title,
    summary,
    proposedFix,
    whyItMatters,
    implementationNotes,
    riskLevel: parseRiskLevel(record.riskLevel),
    requiresIntegration: parseIntegrationRequirement(record.requiresIntegration),
    approvalRequired:
      typeof record.approvalRequired === "boolean" ? record.approvalRequired : true,
    metadata,
  };
}

/**
 * Synchronously generates a review-first task prepared fix via Hermes.
 */
export async function generateTaskPreparedFix(
  input: HermesGenerateTaskFixInput
): Promise<HermesTaskPreparedFixResult> {
  if (canUseHermesStub()) {
    return generateTaskPreparedFixStub(input);
  }

  const config = getHermesEnvConfig();
  const payload = {
    ...input,
    model: input.model ?? config.model ?? undefined,
    constraints: input.constraints,
  };

  const response = await hermesFetch<{ data?: unknown } & Record<string, unknown>>(
    "/v1/generate/task-fix",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const result =
    response.data && typeof response.data === "object"
      ? response.data
      : typeof response.text === "string"
        ? response.text
        : response;

  return validateTaskPreparedFixResult(result);
}
