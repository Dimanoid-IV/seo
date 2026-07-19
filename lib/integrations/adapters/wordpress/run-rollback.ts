/**
 * Orchestrates WordPress live-publish rollback via IntegrationExecutionJob (11.53).
 * Moves WP post to draft/private — never deletes.
 */
import "server-only";

import {
  ActivityType,
  ArticleStatus,
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
  TimelineEventSource,
  TimelineEventType,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { getApplicationPasswordCredentials } from "@/lib/integrations/wordpress/connect-application-password";
import { IntegrationCapability } from "@/lib/integrations/adapters/capabilities";
import {
  appendIntegrationExecutionEvent,
  createIntegrationExecutionJob,
  markExecutionJobFailed,
  markExecutionJobRunning,
  markExecutionJobSucceeded,
} from "@/lib/integrations/execution-jobs";
import { sanitizeExecutionPayload } from "@/lib/integrations/execution-sanitize";
import { rollbackWordPressRestPost } from "@/lib/integrations/adapters/wordpress/rollback-article";
import {
  buildWordPressRollbackIdempotencyKey,
  canRollbackArticleViaWordPress,
  type CanRollbackArticleViaWordPressResult,
} from "@/lib/integrations/adapters/wordpress/can-rollback";

export type RunWordPressRollbackInput = {
  userId: string;
  organizationId: string;
  websiteId: string;
  articleId: string;
  /** Prefer draft; private is allowed if explicitly requested. */
  targetStatus?: "draft" | "private";
};

export type RunWordPressRollbackResult = {
  allowed: boolean;
  gate: CanRollbackArticleViaWordPressResult;
  jobId?: string;
  created?: boolean;
  executed: boolean;
  rolledBack: boolean;
  wordpressPostId?: string;
  wordpressStatus?: string;
  articleStatus?: ArticleStatus;
  blockedReason?: string | null;
  summaryKey: string;
};

export async function runWordPressRollbackForArticle(
  input: RunWordPressRollbackInput
): Promise<RunWordPressRollbackResult> {
  const prisma = getPrisma();

  const [article, website, wpConnection, publishJob] = await Promise.all([
    prisma.article.findFirst({
      where: {
        id: input.articleId,
        websiteId: input.websiteId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        websiteId: true,
        organizationId: true,
        status: true,
        wordpressPostId: true,
        wordpressEditUrl: true,
        wordpressPublishedUrl: true,
        title: true,
      },
    }),
    prisma.website.findFirst({
      where: {
        id: input.websiteId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: { id: true, organizationId: true },
    }),
    prisma.wordPressConnection.findFirst({
      where: { websiteId: input.websiteId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        disconnectedAt: true,
        apiSecretEncrypted: true,
      },
    }),
    prisma.integrationExecutionJob.findFirst({
      where: {
        websiteId: input.websiteId,
        organizationId: input.organizationId,
        sourceType: IntegrationExecutionSourceType.ARTICLE,
        sourceId: input.articleId,
        action: IntegrationExecutionAction.PUBLISH,
        provider: IntegrationExecutionProvider.WORDPRESS,
        status: IntegrationExecutionStatus.SUCCEEDED,
      },
      select: { id: true, externalId: true, externalUrl: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Website not found");
  }

  const gate = canRollbackArticleViaWordPress({
    article,
    website,
    organization: { id: input.organizationId },
    wordpressConnection: wpConnection
      ? {
          status: wpConnection.status,
          disconnectedAt: wpConnection.disconnectedAt,
          hasCredentials: Boolean(wpConnection.apiSecretEncrypted),
        }
      : null,
    rankBoostPublishJobExists: Boolean(publishJob),
  });

  if (!gate.allowed || !article?.wordpressPostId) {
    return {
      allowed: false,
      gate,
      executed: false,
      rolledBack: false,
      blockedReason: gate.blockedReason,
      summaryKey: gate.blockedReason ?? "rollback_blocked",
    };
  }

  const idempotencyKey = buildWordPressRollbackIdempotencyKey({
    articleId: article.id,
    wordpressPostId: article.wordpressPostId,
  });

  const preview = sanitizeExecutionPayload({
    articleId: article.id,
    wordpressPostId: article.wordpressPostId,
    targetStatus: input.targetStatus ?? "draft",
    provider: "WORDPRESS",
    action: "ROLLBACK",
  });

  const { job, created } = await createIntegrationExecutionJob({
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    wordpressConnectionId: wpConnection?.id ?? null,
    requestedByUserId: input.userId,
    sourceType: IntegrationExecutionSourceType.ARTICLE,
    sourceId: article.id,
    action: IntegrationExecutionAction.ROLLBACK,
    provider: IntegrationExecutionProvider.WORDPRESS,
    mode: IntegrationExecutionMode.REVIEW_ONLY,
    capability: IntegrationCapability.ROLLBACK_WORDPRESS_ARTICLE,
    idempotencyKey,
    requestPreview: preview,
  });

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: "WordPress rollback queued.",
  });

  if (
    !created &&
    (job.status === IntegrationExecutionStatus.SUCCEEDED ||
      job.status === IntegrationExecutionStatus.PARTIALLY_APPLIED)
  ) {
    return {
      allowed: true,
      gate,
      jobId: job.id,
      created: false,
      executed: false,
      rolledBack: job.status === IntegrationExecutionStatus.SUCCEEDED,
      wordpressPostId: job.externalId ?? undefined,
      summaryKey:
        job.status === IntegrationExecutionStatus.SUCCEEDED
          ? "wordpressAlreadyRolledBack"
          : "wordpressRollbackPartialAlreadyRecorded",
    };
  }

  if (!created && job.status === IntegrationExecutionStatus.RUNNING) {
    return {
      allowed: true,
      gate,
      jobId: job.id,
      created: false,
      executed: false,
      rolledBack: false,
      summaryKey: "wordpressRollbackInProgress",
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
    message: "WordPress rollback running.",
  });

  const credentials = await getApplicationPasswordCredentials(input.websiteId);
  if (!credentials) {
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "wordpress_credentials_missing",
      errorMessage: "WordPress Application Password credentials are missing.",
    });
    return {
      allowed: true,
      gate,
      jobId: job.id,
      created,
      executed: true,
      rolledBack: false,
      blockedReason: "wordpress_unhealthy",
      summaryKey: "wordpress_credentials_missing",
    };
  }

  let rollbackResult;
  try {
    rollbackResult = await rollbackWordPressRestPost(credentials, {
      postId: article.wordpressPostId,
      targetStatus: input.targetStatus ?? "draft",
    });
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "WordPress rollback failed.";
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "wordpress_rollback_failed",
      errorMessage: message,
    });
    await appendIntegrationExecutionEvent({
      jobId: job.id,
      type: "failed",
      status: IntegrationExecutionStatus.FAILED,
      message,
    });
    return {
      allowed: true,
      gate,
      jobId: job.id,
      created,
      executed: true,
      rolledBack: false,
      blockedReason: "wordpress_rollback_failed",
      summaryKey: "wordpressRollbackFailed",
    };
  }

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "wordpress_response",
    status: IntegrationExecutionStatus.RUNNING,
    message: `WordPress returned status=${rollbackResult.status}.`,
    metadata: {
      postId: rollbackResult.postId,
      status: rollbackResult.status,
      rolledBack: rollbackResult.rolledBack,
    },
  });

  if (!rollbackResult.rolledBack) {
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "WP_UNEXPECTED_STATUS",
      errorMessage: `WordPress returned unexpected status: ${rollbackResult.status}`,
      result: {
        status: rollbackResult.status,
        rolledBack: false,
      },
    });
    return {
      allowed: true,
      gate,
      jobId: job.id,
      created,
      executed: true,
      rolledBack: false,
      summaryKey: "wordpressUnexpectedStatus",
    };
  }

  const now = new Date();
  const nextArticleStatus =
    rollbackResult.status === "draft"
      ? ArticleStatus.WORDPRESS_DRAFT_CREATED
      : ArticleStatus.WAITING_REVIEW;

  const historicalUrl =
    article.wordpressPublishedUrl ??
    publishJob?.externalUrl ??
    null;

  await prisma.$transaction(async (tx) => {
    await tx.article.update({
      where: { id: article.id },
      data: {
        status: nextArticleStatus,
        wordpressPostId: rollbackResult.postId,
        wordpressEditUrl: rollbackResult.editUrl,
        wordpressPublishedUrl: historicalUrl,
        wordpressRolledBackAt: now,
      },
    });

    await tx.activity.create({
      data: {
        organizationId: input.organizationId,
        websiteId: input.websiteId,
        userId: input.userId,
        type: ActivityType.SYSTEM_NOTICE,
        title: "WordPress post moved back from live",
        description: `Статья «${article.title}» снята с публикации в WordPress (${rollbackResult.status}).`,
        metadataJson: {
          articleId: article.id,
          wordpressPostId: rollbackResult.postId,
          wordpressStatus: rollbackResult.status,
          historicalPublishedUrl: historicalUrl,
        },
      },
    });

    await tx.timelineEvent.create({
      data: {
        userId: input.userId,
        websiteId: input.websiteId,
        type: TimelineEventType.SYSTEM_NOTE,
        source: TimelineEventSource.WORDPRESS,
        title: "WordPress rollback",
        summary: `Article moved to ${rollbackResult.status}: ${article.title}`,
        relatedArticleId: article.id,
        details: {
          articleId: article.id,
          wordpressPostId: rollbackResult.postId,
          wordpressStatus: rollbackResult.status,
          historicalPublishedUrl: historicalUrl,
        },
      },
    });
  });

  await markExecutionJobSucceeded({
    jobId: job.id,
    externalId: rollbackResult.postId,
    externalUrl: rollbackResult.editUrl,
    result: {
      status: rollbackResult.status,
      rolledBack: true,
      historicalPublishedUrl: historicalUrl,
      articleStatus: nextArticleStatus,
    },
  });

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "succeeded",
    status: IntegrationExecutionStatus.SUCCEEDED,
    message: "WordPress rollback succeeded.",
  });

  return {
    allowed: true,
    gate,
    jobId: job.id,
    created,
    executed: true,
    rolledBack: true,
    wordpressPostId: rollbackResult.postId,
    wordpressStatus: rollbackResult.status,
    articleStatus: nextArticleStatus,
    summaryKey: "wordpressRolledBack",
  };
}
