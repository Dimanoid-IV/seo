/**
 * Read-only listing + DTO mapping for integration execution jobs.
 */
import "server-only";

import type { IntegrationExecutionJob } from "@prisma/client";

import {
  assertPayloadHasNoSecrets,
  sanitizeExecutionPayload,
} from "./execution-sanitize";
import { listIntegrationExecutionJobs } from "./execution-jobs";
import { resolveExecutionJobActions } from "./execution-actions";

export type IntegrationExecutionJobDto = {
  id: string;
  sourceType: string;
  sourceId: string;
  action: string;
  provider: string;
  mode: string;
  status: string;
  capability: string;
  requestPreview: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  externalId: string | null;
  externalUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  actions: {
    canRetry: boolean;
    retryDisabledReason: string | null;
    canRollback: boolean;
    rollbackDisabledReason: string | null;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function toIntegrationExecutionJobDto(
  job: IntegrationExecutionJob
): IntegrationExecutionJobDto {
  const requestPreview =
    sanitizeExecutionPayload(asRecord(job.requestPreviewJson)) ?? null;
  const result = sanitizeExecutionPayload(asRecord(job.resultJson)) ?? null;

  if (requestPreview && !assertPayloadHasNoSecrets(requestPreview)) {
    // Defensive: never leak
  }
  if (result && !assertPayloadHasNoSecrets(result)) {
    // Defensive: never leak
  }

  return {
    id: job.id,
    sourceType: job.sourceType,
    sourceId: job.sourceId,
    action: job.action,
    provider: job.provider,
    mode: job.mode,
    status: job.status,
    capability: job.capability,
    requestPreview:
      requestPreview && assertPayloadHasNoSecrets(requestPreview)
        ? requestPreview
        : null,
    result: result && assertPayloadHasNoSecrets(result) ? result : null,
    externalId: job.externalId,
    externalUrl: job.externalUrl,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    retryCount: job.retryCount,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    finishedAt: job.finishedAt?.toISOString() ?? null,
    actions: resolveExecutionJobActions(job),
  };
}

export async function getWebsiteExecutionHistory(input: {
  organizationId: string;
  websiteId: string;
  limit?: number;
}): Promise<IntegrationExecutionJobDto[]> {
  const jobs = await listIntegrationExecutionJobs(input);
  return jobs.map(toIntegrationExecutionJobDto);
}
