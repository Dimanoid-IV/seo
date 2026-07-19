/**
 * Safe execution-history actions: retry failed jobs, rollback succeeded publishes.
 */
import "server-only";

import {
  IntegrationExecutionAction,
  IntegrationExecutionProvider,
  IntegrationExecutionStatus,
  MonthlyAutopilotStatus,
  AutopilotMode,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { runWordPressLivePublishForPlanArticle } from "@/lib/integrations/adapters/wordpress/run-live-publish";
import { runWordPressRollbackForArticle } from "@/lib/integrations/adapters/wordpress/run-rollback";
import { parsePlanItemsDocument } from "@/lib/autopilot/plan-items";
import type { AutopilotPlanItem } from "@/lib/autopilot/plan-item-types";

export type ExecutionJobActionAvailability = {
  canRetry: boolean;
  retryDisabledReason: string | null;
  canRollback: boolean;
  rollbackDisabledReason: string | null;
};

export function resolveExecutionJobActions(job: {
  action: string;
  status: string;
  provider: string;
  sourceType: string;
  sourceId: string;
}): ExecutionJobActionAvailability {
  let canRetry = false;
  let retryDisabledReason: string | null = null;
  let canRollback = false;
  let rollbackDisabledReason: string | null = null;

  if (
    job.status === IntegrationExecutionStatus.FAILED &&
    job.action === IntegrationExecutionAction.PUBLISH &&
    job.provider === IntegrationExecutionProvider.WORDPRESS
  ) {
    canRetry = true;
  } else if (job.status === IntegrationExecutionStatus.FAILED) {
    retryDisabledReason = "Only failed WordPress publish jobs can be retried.";
  } else {
    retryDisabledReason = "Retry is only available for failed jobs.";
  }

  if (
    job.status === IntegrationExecutionStatus.SUCCEEDED &&
    job.action === IntegrationExecutionAction.PUBLISH &&
    job.provider === IntegrationExecutionProvider.WORDPRESS &&
    job.sourceType === "ARTICLE"
  ) {
    canRollback = true;
  } else if (job.action === IntegrationExecutionAction.ROLLBACK) {
    rollbackDisabledReason = "This job is already a rollback.";
  } else if (job.status !== IntegrationExecutionStatus.SUCCEEDED) {
    rollbackDisabledReason = "Rollback requires a succeeded publish job.";
  } else {
    rollbackDisabledReason =
      "Rollback is only available for RankBoost WordPress publish jobs.";
  }

  return {
    canRetry,
    retryDisabledReason: canRetry ? null : retryDisabledReason,
    canRollback,
    rollbackDisabledReason: canRollback ? null : rollbackDisabledReason,
  };
}

export async function retryFailedWordPressPublishJob(input: {
  userId: string;
  organizationId: string;
  jobId: string;
}): Promise<{
  retried: boolean;
  summaryKey: string;
  livePublished: boolean;
  jobId?: string;
  blockedReason?: string | null;
}> {
  const prisma = getPrisma();
  const job = await prisma.integrationExecutionJob.findFirst({
    where: {
      id: input.jobId,
      organizationId: input.organizationId,
    },
  });
  if (!job) {
    throw new AppError(ErrorCode.NOT_FOUND, "Execution job not found");
  }

  const actions = resolveExecutionJobActions(job);
  if (!actions.canRetry) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      actions.retryDisabledReason ?? "Retry is not available for this job."
    );
  }

  const articleId = job.sourceId;
  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
      organizationId: input.organizationId,
      websiteId: job.websiteId,
      deletedAt: null,
    },
    select: { id: true, status: true, wordpressPostId: true },
  });
  if (!article) {
    throw new AppError(ErrorCode.NOT_FOUND, "Article not found");
  }

  // Idempotency: already published → do not create a second post.
  if (article.status === "PUBLISHED" && article.wordpressPostId) {
    return {
      retried: false,
      summaryKey: "already_published_by_rankboost",
      livePublished: true,
      jobId: job.id,
      blockedReason: "already_published_by_rankboost",
    };
  }

  const plan = await prisma.monthlyAutopilotPlan.findFirst({
    where: {
      websiteId: job.websiteId,
      organizationId: input.organizationId,
      archivedAt: null,
      status: MonthlyAutopilotStatus.APPROVED,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!plan) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "No approved plan found to retry live publish."
    );
  }

  const document = plan.planItemsJson
    ? parsePlanItemsDocument(plan.planItemsJson)
    : null;
  const planItem =
    (document?.items.find(
      (item) =>
        item.type === "ARTICLE" && item.generatedArticleId === articleId
    ) as AutopilotPlanItem | undefined) ?? null;

  if (!planItem) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "No matching plan item for this article."
    );
  }

  const websiteState = await prisma.websiteUserState.findFirst({
    where: { userId: input.userId, websiteId: job.websiteId },
    select: { autopilotMode: true },
  });

  const result = await runWordPressLivePublishForPlanArticle({
    userId: input.userId,
    organizationId: input.organizationId,
    websiteId: job.websiteId,
    articleId,
    planId: plan.id,
    planItem,
    planStatus: plan.status,
    planPublishingMode: plan.publishingMode,
    autopilotMode: websiteState?.autopilotMode ?? AutopilotMode.AUTOPUBLISH,
  });

  return {
    retried: result.executed || Boolean(result.jobId),
    summaryKey: result.summaryKey,
    livePublished: result.livePublished,
    jobId: result.jobId,
    blockedReason: result.blockedReason,
  };
}

export async function rollbackFromPublishJob(input: {
  userId: string;
  organizationId: string;
  jobId: string;
  targetStatus?: "draft" | "private";
}): Promise<{
  rolledBack: boolean;
  summaryKey: string;
  jobId?: string;
  blockedReason?: string | null;
  articleStatus?: string;
}> {
  const prisma = getPrisma();
  const job = await prisma.integrationExecutionJob.findFirst({
    where: {
      id: input.jobId,
      organizationId: input.organizationId,
    },
  });
  if (!job) {
    throw new AppError(ErrorCode.NOT_FOUND, "Execution job not found");
  }

  const actions = resolveExecutionJobActions(job);
  if (!actions.canRollback) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      actions.rollbackDisabledReason ??
        "Rollback is not available for this job."
    );
  }

  const result = await runWordPressRollbackForArticle({
    userId: input.userId,
    organizationId: input.organizationId,
    websiteId: job.websiteId,
    articleId: job.sourceId,
    targetStatus: input.targetStatus ?? "draft",
  });

  return {
    rolledBack: result.rolledBack,
    summaryKey: result.summaryKey,
    jobId: result.jobId,
    blockedReason: result.blockedReason,
    articleStatus: result.articleStatus,
  };
}
