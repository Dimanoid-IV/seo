/**
 * Orchestrates approved preparedFix → WordPress metadata update.
 * Completes nothing by itself; caller decides task completion after verified success.
 */
import "server-only";

import {
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
  WordPressConnectionStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { IntegrationCapability } from "@/lib/integrations/adapters/capabilities";
import {
  appendIntegrationExecutionEvent,
  createIntegrationExecutionJob,
  markExecutionJobFailed,
  markExecutionJobPartiallyApplied,
  markExecutionJobRunning,
  markExecutionJobSucceeded,
} from "@/lib/integrations/execution-jobs";
import { getApplicationPasswordCredentials } from "@/lib/integrations/wordpress/connect-application-password";
import { parseTaskRecommendationWithFix } from "@/lib/tasks/prepared-fix";

import {
  parsePreparedMetadataValue,
  updateWordPressCoreMetadata,
  verifyWordPressMetadataUpdate,
} from "./update-metadata";

export type RunWordPressMetadataUpdateInput = {
  userId: string;
  organizationId: string;
  websiteId: string;
  taskId: string;
  dryRun?: boolean;
};

export type RunWordPressMetadataUpdateResult = {
  jobId?: string;
  created?: boolean;
  executed: boolean;
  applied: boolean;
  verified: boolean;
  externalId?: string | null;
  externalUrl?: string | null;
  editUrl?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export function buildWordPressMetadataIdempotencyKey(input: {
  taskId: string;
  preparedFixId: string;
}): string {
  return `wordpress:metadata:task:${input.taskId}:fix:${input.preparedFixId}`;
}

function isWordPressMetadataFix(input: {
  expectedAction: string | null;
  preparedFix: {
    type: string;
    field?: string;
    requiresIntegration?: string;
  };
}): boolean {
  return (
    input.expectedAction === "UPDATE_METADATA" ||
    (input.preparedFix.type === "META_FIX" &&
      input.preparedFix.field === "metadata" &&
      input.preparedFix.requiresIntegration === "wordpress")
  );
}

export async function runWordPressMetadataUpdateForTask(
  input: RunWordPressMetadataUpdateInput
): Promise<RunWordPressMetadataUpdateResult> {
  const prisma = getPrisma();

  const [task, wpConnection, integration] = await Promise.all([
    prisma.task.findFirst({
      where: {
        id: input.taskId,
        websiteId: input.websiteId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        recommendationJson: true,
        websiteId: true,
        organizationId: true,
      },
    }),
    prisma.wordPressConnection.findFirst({
      where: {
        websiteId: input.websiteId,
        organizationId: input.organizationId,
        status: WordPressConnectionStatus.CONNECTED,
        disconnectedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        apiSecretEncrypted: true,
        permissionsJson: true,
      },
    }),
    prisma.integration.findUnique({
      where: {
        websiteId_provider: {
          websiteId: input.websiteId,
          provider: "WORDPRESS",
        },
      },
      select: { id: true },
    }),
  ]);

  if (!task) {
    throw new AppError(ErrorCode.NOT_FOUND, "Task not found");
  }

  const parsed = parseTaskRecommendationWithFix(task.recommendationJson);
  if (!parsed.preparedFix) {
    throw new AppError(ErrorCode.NOT_FOUND, "Prepared fix not found");
  }

  if (
    !isWordPressMetadataFix({
      expectedAction: parsed.expectedAction,
      preparedFix: parsed.preparedFix,
    })
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "This prepared fix is not a WordPress metadata update."
    );
  }

  const metadata = parsePreparedMetadataValue(parsed.preparedFix.suggestedValue);
  const idempotencyKey = buildWordPressMetadataIdempotencyKey({
    taskId: task.id,
    preparedFixId: parsed.preparedFix.id,
  });

  const requestPreview = {
    provider: "WORDPRESS",
    action: "APPLY_SEO_FIX",
    capability: IntegrationCapability.APPLY_SEO_META,
    targetUrl: metadata.targetUrl,
    targetQuery: metadata.targetQuery,
    metaTitle: metadata.metaTitle,
    metaDescriptionLength: metadata.metaDescription.length,
  };

  if (input.dryRun) {
    return {
      executed: false,
      applied: false,
      verified: false,
    };
  }

  const { job, created } = await createIntegrationExecutionJob({
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    integrationId: integration?.id ?? null,
    wordpressConnectionId: wpConnection?.id ?? null,
    requestedByUserId: input.userId,
    approvedByUserId: input.userId,
    sourceType: IntegrationExecutionSourceType.PREPARED_FIX,
    sourceId: parsed.preparedFix.id,
    action: IntegrationExecutionAction.APPLY_SEO_FIX,
    provider: IntegrationExecutionProvider.WORDPRESS,
    mode: IntegrationExecutionMode.REVIEW_ONLY,
    capability: IntegrationCapability.APPLY_SEO_META,
    idempotencyKey,
    requestPreview,
  });

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: "WordPress metadata update queued.",
  });

  if (
    !created &&
    (job.status === IntegrationExecutionStatus.SUCCEEDED ||
      job.status === IntegrationExecutionStatus.PARTIALLY_APPLIED)
  ) {
    return {
      jobId: job.id,
      created: false,
      executed: false,
      applied: job.status === IntegrationExecutionStatus.SUCCEEDED,
      verified: job.status === IntegrationExecutionStatus.SUCCEEDED,
      externalId: job.externalId,
      externalUrl: job.externalUrl,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage,
    };
  }

  if (!wpConnection?.apiSecretEncrypted) {
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "wordpress_not_connected",
      errorMessage: "WordPress is not connected.",
    });
    return {
      jobId: job.id,
      created,
      executed: true,
      applied: false,
      verified: false,
      errorCode: "wordpress_not_connected",
      errorMessage: "WordPress is not connected.",
    };
  }

  const credentials = await getApplicationPasswordCredentials(input.websiteId);
  if (!credentials) {
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "wordpress_credentials_missing",
      errorMessage: "WordPress Application Password credentials are missing.",
    });
    return {
      jobId: job.id,
      created,
      executed: true,
      applied: false,
      verified: false,
      errorCode: "wordpress_credentials_missing",
      errorMessage: "WordPress credentials are missing.",
    };
  }

  if (credentials.permissions.canUpdateMeta !== true) {
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "wordpress_meta_permission_missing",
      errorMessage: "WordPress metadata update permission is disabled.",
    });
    return {
      jobId: job.id,
      created,
      executed: true,
      applied: false,
      verified: false,
      errorCode: "wordpress_meta_permission_missing",
      errorMessage: "WordPress metadata update permission is disabled.",
    };
  }

  if (job.status === IntegrationExecutionStatus.FAILED) {
    await prisma.integrationExecutionJob.update({
      where: { id: job.id },
      data: {
        status: IntegrationExecutionStatus.QUEUED,
        errorCode: null,
        errorMessage: null,
        finishedAt: null,
      },
    });
  }

  await markExecutionJobRunning(job.id);
  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "running",
    status: IntegrationExecutionStatus.RUNNING,
    message: "WordPress metadata update running.",
  });

  try {
    const result = await updateWordPressCoreMetadata(credentials, metadata);
    await appendIntegrationExecutionEvent({
      jobId: job.id,
      type: "wordpress_response",
      status: IntegrationExecutionStatus.RUNNING,
      message: "WordPress accepted the metadata update.",
      metadata: {
        objectType: result.objectType,
        postId: result.postId,
        status: result.status,
        titleUpdated: result.titleUpdated,
        excerptUpdated: result.excerptUpdated,
      },
    });

    const verification = await verifyWordPressMetadataUpdate({
      publicUrl: result.link ?? metadata.targetUrl,
      expectedTitle: metadata.metaTitle,
      expectedMetaDescription: metadata.metaDescription,
    });

    await appendIntegrationExecutionEvent({
      jobId: job.id,
      type: "verification",
      status: IntegrationExecutionStatus.RUNNING,
      message: verification.verified
        ? "Public metadata verification passed."
        : "Public metadata verification did not pass.",
      metadata: {
        statusCode: verification.statusCode,
        checks: verification.checks,
        errorCode: verification.errorCode,
      },
    });

    const safeResult = {
      objectType: result.objectType,
      postId: result.postId,
      status: result.status,
      editUrl: result.editUrl,
      link: result.link,
      titleUpdated: result.titleUpdated,
      excerptUpdated: result.excerptUpdated,
      verification,
    };

    if (!verification.verified) {
      await markExecutionJobPartiallyApplied({
        jobId: job.id,
        result: safeResult,
        externalId: result.postId,
        externalUrl: result.link ?? metadata.targetUrl,
        errorCode: verification.errorCode ?? "metadata_not_verified",
        errorMessage:
          "WordPress accepted the change, but RankBoost could not verify the public title/meta description.",
      });
      return {
        jobId: job.id,
        created,
        executed: true,
        applied: false,
        verified: false,
        externalId: result.postId,
        externalUrl: result.link ?? metadata.targetUrl,
        editUrl: result.editUrl,
        errorCode: verification.errorCode ?? "metadata_not_verified",
        errorMessage:
          "WordPress accepted the change, but public verification failed.",
      };
    }

    await markExecutionJobSucceeded({
      jobId: job.id,
      result: safeResult,
      externalId: result.postId,
      externalUrl: result.link ?? metadata.targetUrl,
    });

    return {
      jobId: job.id,
      created,
      executed: true,
      applied: true,
      verified: true,
      externalId: result.postId,
      externalUrl: result.link ?? metadata.targetUrl,
      editUrl: result.editUrl,
    };
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "WordPress metadata update failed.";
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode:
        error instanceof AppError ? error.code : "wordpress_metadata_failed",
      errorMessage: message,
    });
    return {
      jobId: job.id,
      created,
      executed: true,
      applied: false,
      verified: false,
      errorCode:
        error instanceof AppError ? error.code : "wordpress_metadata_failed",
      errorMessage: message,
    };
  }
}
