import { z } from "zod";

import {
  AppError,
  createErrorBody,
  getRequestId,
  toAppError,
  type ApiErrorBody,
} from "@/lib/errors";

import {
  calculateEstimatedFixTime,
  calculateRawRuleScore,
  getPreviewIssues,
} from "./rule-engine";
import type { AuditRuleResult } from "./rules-types";
import { AuditRuleStatus as Status } from "./rules-types";
import type { OnPageSeoData } from "./onpage-types";
import { AuditScannerErrorCode } from "./types";
import type { WebsiteScanResult } from "./types";

/** POST /api/audit/preview request body. */
export const auditPreviewInputSchema = z.object({
  url: z.string().trim().min(1, "URL обязателен"),
});

export type AuditPreviewInput = z.infer<typeof auditPreviewInputSchema>;

export type ScoreLabel = "poor" | "needs_work" | "good" | "strong";

export type AuditPreviewIssue = {
  code: string;
  category: string;
  severity: string;
  title: string;
  whyItMatters: string;
  recommendation: string;
  scoreImpact: number;
  estimatedFixMinutes: number;
};

export type AuditPreviewResponseData = {
  url: {
    input: string;
    normalized: string;
    final: string;
  };
  score: {
    raw: number;
    label: ScoreLabel;
  };
  summary: {
    statusCode: number;
    responseTimeMs: number;
    htmlSize: number;
    title: string | null;
    metaDescriptionExists: boolean;
    h1Count: number;
    wordCount: number;
    estimatedFixMinutes: number;
  };
  previewIssues: AuditPreviewIssue[];
  checksCount: {
    total: number;
    pass: number;
    warning: number;
    fail: number;
  };
  generatedAt: string;
};

export type AuditPreviewPayload = {
  data: AuditPreviewResponseData;
};

export type AuditPreviewResponse = AuditPreviewPayload & {
  previewToken: string | null;
  warning?: string | null;
};

const SCANNER_HTTP_STATUS: Record<string, number> = {
  [AuditScannerErrorCode.INVALID_URL]: 400,
  [AuditScannerErrorCode.SSRF_BLOCKED]: 400,
  [AuditScannerErrorCode.BLOCKED_HOST]: 400,
  [AuditScannerErrorCode.TIMEOUT]: 408,
  [AuditScannerErrorCode.WEBSITE_UNREACHABLE]: 422,
  [AuditScannerErrorCode.DNS_FAILURE]: 422,
  [AuditScannerErrorCode.SSL_FAILURE]: 422,
  [AuditScannerErrorCode.UNSUPPORTED_CONTENT_TYPE]: 415,
  [AuditScannerErrorCode.TOO_LARGE]: 413,
};

/** Maps raw rule score (0–100) to a human-readable label. */
export function getScoreLabel(rawScore: number): ScoreLabel {
  if (rawScore <= 39) {
    return "poor";
  }
  if (rawScore <= 69) {
    return "needs_work";
  }
  if (rawScore <= 84) {
    return "good";
  }
  return "strong";
}

function mapPreviewIssue(issue: AuditRuleResult): AuditPreviewIssue {
  return {
    code: issue.code,
    category: issue.category,
    severity: issue.severity,
    title: issue.title,
    whyItMatters: issue.whyItMatters,
    recommendation: issue.recommendation,
    scoreImpact: issue.scoreImpact,
    estimatedFixMinutes: issue.estimatedFixMinutes,
  };
}

function countChecks(results: AuditRuleResult[]): AuditPreviewResponseData["checksCount"] {
  return {
    total: results.length,
    pass: results.filter((result) => result.status === Status.PASS).length,
    warning: results.filter((result) => result.status === Status.WARNING).length,
    fail: results.filter((result) => result.status === Status.FAIL).length,
  };
}

type BuildPreviewParams = {
  inputUrl: string;
  scan: WebsiteScanResult;
  onPage: OnPageSeoData;
  results: AuditRuleResult[];
  generatedAt?: string;
};

/**
 * Builds the public preview audit payload (no HTML, headers, or full rule dump).
 */
export function buildAuditPreviewResponse(
  params: BuildPreviewParams
): AuditPreviewPayload {
  const { inputUrl, scan, onPage, results } = params;
  const rawScore = calculateRawRuleScore(results);
  const estimatedFixMinutes = calculateEstimatedFixTime(results);
  const previewIssues = getPreviewIssues(results, 5);

  return {
    data: {
      url: {
        input: inputUrl,
        normalized: scan.normalizedUrl,
        final: scan.finalUrl,
      },
      score: {
        raw: rawScore,
        label: getScoreLabel(rawScore),
      },
      summary: {
        statusCode: scan.statusCode,
        responseTimeMs: scan.responseTimeMs,
        htmlSize: scan.htmlSize,
        title: onPage.title.text,
        metaDescriptionExists: onPage.metaDescription.exists,
        h1Count: onPage.h1.count,
        wordCount: onPage.wordCount,
        estimatedFixMinutes,
      },
      previewIssues: previewIssues.map(mapPreviewIssue),
      checksCount: countChecks(results),
      generatedAt: params.generatedAt ?? new Date().toISOString(),
    },
  };
}

function resolvePreviewErrorStatus(error: AppError): number {
  const scannerError = error.details.scannerError;

  if (typeof scannerError === "string" && scannerError in SCANNER_HTTP_STATUS) {
    return SCANNER_HTTP_STATUS[scannerError]!;
  }

  return error.statusCode;
}

/**
 * Builds a JSON error payload for the preview API with scanner-specific HTTP status codes.
 */
export function createAuditPreviewErrorResponse(
  error: unknown,
  requestId?: string
): {
  status: number;
  body: ApiErrorBody;
  headers: Record<string, string>;
} {
  const appError = toAppError(error);
  const id = getRequestId(requestId);
  const status = resolvePreviewErrorStatus(appError);

  return {
    status,
    body: createErrorBody(appError, id),
    headers: {
      "X-Request-Id": id,
      "Content-Type": "application/json",
    },
  };
}
