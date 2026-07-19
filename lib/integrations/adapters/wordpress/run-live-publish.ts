/**
 * Orchestrates WordPress live publish via IntegrationExecutionJob (Prompt 11.51).
 * Never prints secrets. Idempotent per article+plan+item.
 */
import "server-only";

import {
  ActivityType,
  ArticleStatus,
  AutopilotMode,
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
  MonthlyAutopilotStatus,
  TimelineEventSource,
  TimelineEventType,
  WordPressConnectionStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { checkUsageLimit } from "@/lib/billing/usage";
import { canUseFeature } from "@/lib/billing/feature-gates";
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
import { isLivePublishKillSwitchEngaged } from "@/lib/integrations/live-publish-gate";
import { createWordPressRestPublishedPost } from "@/lib/integrations/adapters/wordpress/publish-article";
import {
  buildWordPressPublishIdempotencyKey,
  canLivePublishArticleViaWordPress,
  type CanLivePublishArticleViaWordPressResult,
} from "@/lib/integrations/adapters/wordpress/can-live-publish";
import type { AutopilotPlanItem } from "@/lib/autopilot/plan-item-types";
import type { PlanPublishingModeValue } from "@/lib/autopilot/plan-publishing-mode";

export type RunWordPressLivePublishInput = {
  userId: string;
  organizationId: string;
  websiteId: string;
  articleId: string;
  planId: string;
  planItem: AutopilotPlanItem;
  planStatus: MonthlyAutopilotStatus | string;
  planPublishingMode: PlanPublishingModeValue | string | null;
  autopilotMode: AutopilotMode | string;
  dryRun?: boolean;
};

export type RunWordPressLivePublishResult = {
  allowed: boolean;
  gate: CanLivePublishArticleViaWordPressResult;
  jobId?: string;
  created?: boolean;
  executed: boolean;
  livePublished: boolean;
  wordpressPostId?: string;
  publishedUrl?: string | null;
  editUrl?: string | null;
  articleStatus?: ArticleStatus;
  blockedReason?: string | null;
  summaryKey: string;
};

async function markJobPartiallyApplied(input: {
  jobId: string;
  result?: Record<string, unknown> | null;
  externalId?: string | null;
  externalUrl?: string | null;
  message?: string;
}): Promise<void> {
  const prisma = getPrisma();
  const result = sanitizeExecutionPayload(input.result ?? null);
  await prisma.integrationExecutionJob.update({
    where: { id: input.jobId },
    data: {
      status: IntegrationExecutionStatus.PARTIALLY_APPLIED,
      finishedAt: new Date(),
      resultJson: (result as Prisma.InputJsonValue | undefined) ?? undefined,
      externalId: input.externalId?.slice(0, 200) ?? null,
      externalUrl: input.externalUrl?.slice(0, 500) ?? null,
      errorCode: "WP_STATUS_NOT_PUBLISH",
      errorMessage:
        input.message ??
        "WordPress returned draft/pending — live publish not claimed.",
    },
  });
  await appendIntegrationExecutionEvent({
    jobId: input.jobId,
    type: "job.partially_applied",
    status: IntegrationExecutionStatus.PARTIALLY_APPLIED,
    message:
      input.message ??
      "WordPress returned draft/pending — live publish not claimed.",
    metadata: result,
  });
}

/**
 * Attempt plan-scoped WordPress live publish for one article.
 */
export async function runWordPressLivePublishForPlanArticle(
  input: RunWordPressLivePublishInput
): Promise<RunWordPressLivePublishResult> {
  const prisma = getPrisma();
  const dryRun = input.dryRun ?? false;

  const [article, website, wpConnection, wordpressFeature, quota] =
    await Promise.all([
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
          qualityPassed: true,
          wordpressPostId: true,
          contentHtml: true,
          publishedAt: true,
          title: true,
          slug: true,
          metaDescription: true,
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
      canUseFeature({
        userId: input.userId,
        organizationId: input.organizationId,
        feature: "wordpress",
      }),
      checkUsageLimit({
        userId: input.userId,
        organizationId: input.organizationId,
        websiteId: input.websiteId,
        key: "ARTICLE_DRAFT",
      }),
    ]);

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Website not found");
  }

  let duplicatePublished = false;
  if (article?.wordpressPostId) {
    const other = await prisma.article.findFirst({
      where: {
        websiteId: input.websiteId,
        wordpressPostId: article.wordpressPostId,
        status: ArticleStatus.PUBLISHED,
        deletedAt: null,
        NOT: { id: article.id },
      },
      select: { id: true },
    });
    duplicatePublished = Boolean(other);
  }

  const gate = canLivePublishArticleViaWordPress({
    article,
    website,
    organization: { id: input.organizationId },
    planItem: input.planItem,
    planStatus: input.planStatus,
    autopilotMode: input.autopilotMode,
    planPublishingMode: input.planPublishingMode,
    wordpressConnection: wpConnection
      ? {
          status: wpConnection.status,
          disconnectedAt: wpConnection.disconnectedAt,
          hasCredentials: Boolean(wpConnection.apiSecretEncrypted),
        }
      : null,
    quality: { qualityPassed: article?.qualityPassed },
    killSwitch: { engaged: isLivePublishKillSwitchEngaged() },
    monthlyQuotaOk: wordpressFeature && quota.allowed,
    duplicatePublishedExternalId: duplicatePublished,
  });

  if (!gate.allowed) {
    return {
      allowed: false,
      gate,
      executed: false,
      livePublished: false,
      blockedReason: gate.blockedReason,
      summaryKey: gate.blockedReason ?? "live_publish_blocked",
    };
  }

  if (!article) {
    return {
      allowed: false,
      gate: {
        allowed: false,
        blockedReason: "missing_article",
        userSafeMessage: "No article is linked to this plan item.",
      },
      executed: false,
      livePublished: false,
      blockedReason: "missing_article",
      summaryKey: "missing_article",
    };
  }

  const idempotencyKey = buildWordPressPublishIdempotencyKey({
    articleId: article.id,
    planId: input.planId,
    planItemId: input.planItem.id,
  });

  const preview = sanitizeExecutionPayload({
    title: article.title,
    slug: article.slug,
    status: "publish",
    provider: "WORDPRESS",
    websiteId: input.websiteId,
    articleId: article.id,
    planId: input.planId,
    planItemId: input.planItem.id,
  });

  if (dryRun) {
    return {
      allowed: true,
      gate,
      executed: false,
      livePublished: false,
      summaryKey: "wouldLivePublishWordPress",
    };
  }

  const { job, created } = await createIntegrationExecutionJob({
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    wordpressConnectionId: wpConnection?.id ?? null,
    requestedByUserId: input.userId,
    sourceType: IntegrationExecutionSourceType.ARTICLE,
    sourceId: article.id,
    action: IntegrationExecutionAction.PUBLISH,
    provider: IntegrationExecutionProvider.WORDPRESS,
    mode: IntegrationExecutionMode.AUTO_PUBLISH,
    capability: IntegrationCapability.PUBLISH_WORDPRESS_ARTICLE,
    idempotencyKey,
    requestPreview: preview,
  });

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: "WordPress live publish queued.",
  });

  // Idempotency: if a prior run already succeeded, do not publish again.
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
      livePublished: job.status === IntegrationExecutionStatus.SUCCEEDED,
      wordpressPostId: job.externalId ?? undefined,
      publishedUrl: job.externalUrl,
      blockedReason: null,
      summaryKey:
        job.status === IntegrationExecutionStatus.SUCCEEDED
          ? "wordpressAlreadyPublished"
          : "wordpressPartialAlreadyRecorded",
    };
  }

  if (
    !created &&
    job.status === IntegrationExecutionStatus.RUNNING
  ) {
    return {
      allowed: true,
      gate,
      jobId: job.id,
      created: false,
      executed: false,
      livePublished: false,
      summaryKey: "wordpressPublishInProgress",
    };
  }

  // Re-queue failed jobs by transitioning to RUNNING again when allowed.
  if (
    job.status === IntegrationExecutionStatus.FAILED ||
    job.status === IntegrationExecutionStatus.QUEUED
  ) {
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
  }

  await markExecutionJobRunning(job.id);
  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "running",
    status: IntegrationExecutionStatus.RUNNING,
    message: "WordPress live publish running.",
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
      livePublished: false,
      blockedReason: "wordpress_unhealthy",
      summaryKey: "wordpress_credentials_missing",
    };
  }

  const contentHtml = article.contentHtml?.trim() ?? "";
  if (!contentHtml) {
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "missing_content",
      errorMessage: "Article has no content to publish.",
    });
    return {
      allowed: true,
      gate,
      jobId: job.id,
      created,
      executed: true,
      livePublished: false,
      blockedReason: "missing_content",
      summaryKey: "missing_content",
    };
  }

  let publishResult;
  try {
    publishResult = await createWordPressRestPublishedPost(
      {
        siteUrl: credentials.siteUrl,
        username: credentials.username,
        applicationPassword: credentials.applicationPassword,
      },
      {
        title: article.title,
        contentHtml,
        excerpt: article.metaDescription ?? "",
        slug: article.slug,
        categories: credentials.permissions.defaultCategoryIds,
        author: credentials.permissions.defaultAuthorId,
      }
    );
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "WordPress live publish failed.";
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "wordpress_publish_failed",
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
      livePublished: false,
      blockedReason: "wordpress_publish_failed",
      summaryKey: "wordpressPublishFailed",
    };
  }

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "wordpress_response",
    status: IntegrationExecutionStatus.RUNNING,
    message: `WordPress returned status=${publishResult.status}.`,
    metadata: {
      postId: publishResult.postId,
      status: publishResult.status,
      livePublished: publishResult.livePublished,
      // Never include HTML or credentials.
    },
  });

  if (!publishResult.livePublished) {
    // Save draft/pending ID for review but do not claim PUBLISHED.
    if (
      publishResult.status === "draft" ||
      publishResult.status === "pending"
    ) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          status: ArticleStatus.WORDPRESS_DRAFT_CREATED,
          wordpressPostId: publishResult.postId,
          wordpressEditUrl: publishResult.editUrl,
        },
      });
      await markJobPartiallyApplied({
        jobId: job.id,
        externalId: publishResult.postId,
        externalUrl: publishResult.editUrl,
        result: {
          status: publishResult.status,
          livePublished: false,
        },
        message: `WordPress returned ${publishResult.status} — not claimed as live published.`,
      });
      return {
        allowed: true,
        gate,
        jobId: job.id,
        created,
        executed: true,
        livePublished: false,
        wordpressPostId: publishResult.postId,
        editUrl: publishResult.editUrl,
        articleStatus: ArticleStatus.WORDPRESS_DRAFT_CREATED,
        summaryKey: "wordpressReturnedDraftOrPending",
      };
    }

    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "WP_UNEXPECTED_STATUS",
      errorMessage: `WordPress returned unexpected status: ${publishResult.status}`,
      result: { status: publishResult.status, livePublished: false },
    });
    return {
      allowed: true,
      gate,
      jobId: job.id,
      created,
      executed: true,
      livePublished: false,
      summaryKey: "wordpressUnexpectedStatus",
    };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.article.update({
      where: { id: article.id },
      data: {
        status: ArticleStatus.PUBLISHED,
        wordpressPostId: publishResult.postId,
        wordpressEditUrl: publishResult.editUrl,
        publishedAt: now,
      },
    });

    await tx.wordPressConnection.updateMany({
      where: {
        websiteId: input.websiteId,
        status: WordPressConnectionStatus.CONNECTED,
        disconnectedAt: null,
      },
      data: { lastDraftCreatedAt: now },
    });

    await tx.activity.create({
      data: {
        organizationId: input.organizationId,
        websiteId: input.websiteId,
        userId: input.userId,
        type: ActivityType.SYSTEM_NOTICE,
        title: "Статья опубликована в WordPress",
        description: `Статья «${article.title}» опубликована на сайте.`,
        metadataJson: {
          articleId: article.id,
          wordpressPostId: publishResult.postId,
          publishedUrl: publishResult.link,
          editUrl: publishResult.editUrl,
          planId: input.planId,
          planItemId: input.planItem.id,
        },
      },
    });

    await tx.timelineEvent.create({
      data: {
        userId: input.userId,
        websiteId: input.websiteId,
        type: TimelineEventType.SYSTEM_NOTE,
        source: TimelineEventSource.WORDPRESS,
        title: "WordPress live publish",
        summary: `Article published live: ${article.title}`,
        relatedArticleId: article.id,
        details: {
          articleId: article.id,
          wordpressPostId: publishResult.postId,
          publishedUrl: publishResult.link,
          planId: input.planId,
          planItemId: input.planItem.id,
        },
      },
    });
  });

  await markExecutionJobSucceeded({
    jobId: job.id,
    externalId: publishResult.postId,
    externalUrl: publishResult.link ?? publishResult.editUrl,
    result: {
      status: "publish",
      livePublished: true,
      editUrl: publishResult.editUrl,
    },
  });

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "succeeded",
    status: IntegrationExecutionStatus.SUCCEEDED,
    message: "WordPress live publish succeeded.",
  });

  return {
    allowed: true,
    gate,
    jobId: job.id,
    created,
    executed: true,
    livePublished: true,
    wordpressPostId: publishResult.postId,
    publishedUrl: publishResult.link,
    editUrl: publishResult.editUrl,
    articleStatus: ArticleStatus.PUBLISHED,
    summaryKey: "wordpressLivePublished",
  };
}
