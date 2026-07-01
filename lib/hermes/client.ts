import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { safeLogError } from "@/lib/logging";
import { assertServerOnly } from "@/lib/security";

import type {
  HermesArticleDraftResult,
  HermesGenerateArticleInput,
  HermesGenerateSocialPostInput,
  HermesJobPayload,
  HermesJobStatusResult,
  HermesRepairArticleInput,
  HermesSocialPostDraftResult,
} from "./types";

const DEFAULT_CONSTRAINTS = {
  noFakeClaims: true,
  noGuaranteedRankings: true,
  writeForSmallBusinessOwner: true,
  includeFaq: true,
  includeMeta: true,
} as const;

function getHermesConfig() {
  assertServerOnly();

  const env = getServerEnv();
  const apiUrl = env.HERMES_API_URL?.trim();
  const apiSecret = env.HERMES_API_SECRET?.trim();

  if (!apiUrl || !apiSecret) {
    throw new AppError(
      ErrorCode.HERMES_UNAVAILABLE,
      "Генерация контента временно недоступна. Попробуйте позже."
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/$/, ""),
    apiSecret,
  };
}

function parseHermesError(statusCode: number, body: unknown): AppError {
  const record = body as { message?: string; error?: { message?: string } };
  const message =
    typeof record?.message === "string"
      ? record.message
      : typeof record?.error?.message === "string"
        ? record.error.message
        : `Hermes вернул HTTP ${statusCode}.`;

  if (statusCode === 401 || statusCode === 403) {
    return new AppError(ErrorCode.HERMES_UNAVAILABLE, message);
  }

  if (statusCode >= 500) {
    return new AppError(ErrorCode.HERMES_UNAVAILABLE, message);
  }

  return new AppError(ErrorCode.INTERNAL_ERROR, message);
}

function validateArticleDraftResult(data: unknown): HermesArticleDraftResult {
  if (!data || typeof data !== "object") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes вернул неожиданный ответ при генерации статьи."
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
        `Hermes вернул неполный ответ: отсутствует ${field}.`
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

async function hermesFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { apiUrl, apiSecret } = getHermesConfig();

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiSecret}`,
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    safeLogError("hermes.fetch", error, { path });
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "Hermes не ответил вовремя."
        : "Не удалось связаться с Hermes.";
    throw new AppError(ErrorCode.HERMES_UNAVAILABLE, message);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    safeLogError("hermes.response", new Error(`HTTP ${response.status}`), {
      path,
      status: response.status,
    });
    throw parseHermesError(response.status, body);
  }

  return body as T;
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
      "Hermes вернул неожиданный ответ при генерации social post."
    );
  }

  const record = data as Record<string, unknown>;

  if (typeof record.title !== "string" || record.title.trim() === "") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Hermes вернул неполный social post: отсутствует title."
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
      "Hermes вернул неполный social post: отсутствует text."
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
