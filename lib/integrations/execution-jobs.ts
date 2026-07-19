/**
 * Integration execution job helpers (Prompt 11.49).
 * Foundation only — records jobs/events; does not call WordPress or webhooks.
 */
import "server-only";

import {
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
  type IntegrationExecutionJob,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import {
  buildExecutionIdempotencyKey,
  buildExecutionListWhere,
  canTransitionExecutionStatus,
  foundationExternalActionsEnabled,
  isTerminalExecutionStatus,
} from "./execution-jobs-core";
import {
  assertPayloadHasNoSecrets,
  sanitizeExecutionErrorMessage,
  sanitizeExecutionPayload,
} from "./execution-sanitize";

export {
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
  buildExecutionIdempotencyKey,
  buildExecutionListWhere,
  canTransitionExecutionStatus,
  foundationExternalActionsEnabled,
  isTerminalExecutionStatus,
};

export type CreateIntegrationExecutionJobInput = {
  organizationId: string;
  websiteId: string;
  integrationId?: string | null;
  wordpressConnectionId?: string | null;
  requestedByUserId?: string | null;
  approvedByUserId?: string | null;
  sourceType: IntegrationExecutionSourceType;
  sourceId: string;
  action: IntegrationExecutionAction;
  provider: IntegrationExecutionProvider;
  mode?: IntegrationExecutionMode;
  capability: string;
  idempotencyKey?: string;
  requestPreview?: Record<string, unknown> | null;
  maxRetries?: number;
};

export type CreateIntegrationExecutionJobResult = {
  job: IntegrationExecutionJob;
  created: boolean;
};

/**
 * Creates a job or returns the existing one for the same idempotency key.
 * Records intent only — adapter execute / live publish stays behind the gate.
 */
export async function createIntegrationExecutionJob(
  input: CreateIntegrationExecutionJobInput
): Promise<CreateIntegrationExecutionJobResult> {
  // Job persistence is always allowed. Live execute remains gated separately
  // via evaluateLivePublishGate / foundationExternalActionsEnabled().
  void foundationExternalActionsEnabled;

  const prisma = getPrisma();
  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    buildExecutionIdempotencyKey({
      organizationId: input.organizationId,
      websiteId: input.websiteId,
      provider: input.provider,
      action: input.action,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      capability: input.capability,
    });

  const existing = await prisma.integrationExecutionJob.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    return { job: existing, created: false };
  }

  const preview = sanitizeExecutionPayload(input.requestPreview ?? null);
  if (preview && !assertPayloadHasNoSecrets(preview)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Предпросмотр содержит запрещённые поля."
    );
  }

  try {
    const job = await prisma.integrationExecutionJob.create({
      data: {
        organizationId: input.organizationId,
        websiteId: input.websiteId,
        integrationId: input.integrationId ?? null,
        wordpressConnectionId: input.wordpressConnectionId ?? null,
        requestedByUserId: input.requestedByUserId ?? null,
        approvedByUserId: input.approvedByUserId ?? null,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        action: input.action,
        provider: input.provider,
        mode: input.mode ?? IntegrationExecutionMode.REVIEW_ONLY,
        status: IntegrationExecutionStatus.QUEUED,
        idempotencyKey,
        capability: input.capability.slice(0, 120),
        requestPreviewJson:
          (preview as Prisma.InputJsonValue | undefined) ?? undefined,
        maxRetries: input.maxRetries ?? 3,
      },
    });

    await appendIntegrationExecutionEvent({
      jobId: job.id,
      type: "job.created",
      status: IntegrationExecutionStatus.QUEUED,
      message: "Задание создано (без внешнего действия).",
    });

    return { job, created: true };
  } catch (error) {
    const raced = await prisma.integrationExecutionJob.findUnique({
      where: { idempotencyKey },
    });
    if (raced) return { job: raced, created: false };
    throw error;
  }
}

export async function appendIntegrationExecutionEvent(input: {
  jobId: string;
  type: string;
  status?: IntegrationExecutionStatus | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const prisma = getPrisma();
  const metadata = sanitizeExecutionPayload(input.metadata ?? null);
  await prisma.integrationExecutionEvent.create({
    data: {
      jobId: input.jobId,
      type: input.type.slice(0, 120),
      status: input.status ?? null,
      message: sanitizeExecutionErrorMessage(input.message) ?? null,
      metadataJson: (metadata as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });
}

async function transitionJob(input: {
  jobId: string;
  to: IntegrationExecutionStatus;
  patch?: Prisma.IntegrationExecutionJobUpdateInput;
  eventType: string;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<IntegrationExecutionJob> {
  const prisma = getPrisma();
  const current = await prisma.integrationExecutionJob.findUnique({
    where: { id: input.jobId },
  });
  if (!current) {
    throw new AppError(ErrorCode.NOT_FOUND, "Задание выполнения не найдено");
  }
  if (!canTransitionExecutionStatus(current.status, input.to)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `Недопустимый переход статуса: ${current.status} → ${input.to}`
    );
  }

  const job = await prisma.integrationExecutionJob.update({
    where: { id: input.jobId },
    data: {
      status: input.to,
      ...input.patch,
    },
  });

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: input.eventType,
    status: input.to,
    message: input.message,
    metadata: input.metadata,
  });

  return job;
}

export async function markExecutionJobRunning(
  jobId: string
): Promise<IntegrationExecutionJob> {
  return transitionJob({
    jobId,
    to: IntegrationExecutionStatus.RUNNING,
    patch: { startedAt: new Date() },
    eventType: "job.running",
    message: "Задание запущено (без внешнего действия).",
  });
}

export async function markExecutionJobSucceeded(input: {
  jobId: string;
  result?: Record<string, unknown> | null;
  externalId?: string | null;
  externalUrl?: string | null;
}): Promise<IntegrationExecutionJob> {
  const result = sanitizeExecutionPayload(input.result ?? null);
  if (result && !assertPayloadHasNoSecrets(result)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Результат содержит запрещённые поля."
    );
  }
  let externalUrl: string | null = null;
  if (input.externalUrl) {
    try {
      const url = new URL(input.externalUrl);
      externalUrl = `${url.origin}${url.pathname}`.slice(0, 500);
    } catch {
      externalUrl = null;
    }
  }

  return transitionJob({
    jobId: input.jobId,
    to: IntegrationExecutionStatus.SUCCEEDED,
    patch: {
      finishedAt: new Date(),
      resultJson: (result as Prisma.InputJsonValue | undefined) ?? undefined,
      externalId: input.externalId?.slice(0, 200) ?? null,
      externalUrl,
      errorCode: null,
      errorMessage: null,
    },
    eventType: "job.succeeded",
    message: "Задание успешно завершено (без внешнего действия).",
    metadata: result,
  });
}

export async function markExecutionJobFailed(input: {
  jobId: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  result?: Record<string, unknown> | null;
}): Promise<IntegrationExecutionJob> {
  const result = sanitizeExecutionPayload(input.result ?? null);
  const safeMessage = sanitizeExecutionErrorMessage(input.errorMessage);

  return transitionJob({
    jobId: input.jobId,
    to: IntegrationExecutionStatus.FAILED,
    patch: {
      finishedAt: new Date(),
      resultJson: (result as Prisma.InputJsonValue | undefined) ?? undefined,
      errorCode: input.errorCode?.slice(0, 80) ?? "EXECUTION_FAILED",
      errorMessage: safeMessage,
    },
    eventType: "job.failed",
    message: safeMessage,
    metadata: {
      errorCode: input.errorCode?.slice(0, 80) ?? "EXECUTION_FAILED",
      ...(result ?? {}),
    },
  });
}

/**
 * Lists recent execution jobs for a website within the organization.
 * Tenant isolation: caller must pass verified organizationId + websiteId.
 */
export async function listIntegrationExecutionJobs(input: {
  organizationId: string;
  websiteId: string;
  limit?: number;
}): Promise<IntegrationExecutionJob[]> {
  const prisma = getPrisma();
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  return prisma.integrationExecutionJob.findMany({
    where: buildExecutionListWhere({
      organizationId: input.organizationId,
      websiteId: input.websiteId,
    }),
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
