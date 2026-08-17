import "server-only";

import {
  ActivityType,
  ArticleStatus,
  IntegrationExecutionAction,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
} from "@prisma/client";

import {
  markArticlePublicationFailedInMonthlyPlans,
  markArticlePublishedInMonthlyPlans,
} from "@/lib/autopilot/link-article-publication";
import { getPrisma } from "@/lib/db";
import {
  claimDueExecutionJob,
  markExecutionJobFailed,
  markExecutionJobSucceeded,
  markExecutionJobWaiting,
  recordPublishAttempt,
} from "@/lib/integrations/execution-jobs";
import {
  hasPublicationVerificationAttemptsRemaining,
  nextPublicationVerificationAt,
} from "@/lib/publishing/publish-retry";
import { verifyPublishedPage } from "@/lib/publishing/publish-verification";
import { safeLogInfo, safeLogWarn } from "@/lib/logging";

export type PublicationVerificationRunReport = {
  scanned: number;
  claimed: number;
  verified: number;
  rescheduled: number;
  failed: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function runDuePublicationVerifications(input: {
  now?: Date;
  limit?: number;
  articleId?: string;
  organizationId?: string;
  ignoreSchedule?: boolean;
} = {}): Promise<PublicationVerificationRunReport> {
  const prisma = getPrisma();
  const now = input.now ?? new Date();
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
  const dueJobs = await prisma.integrationExecutionJob.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              provider: IntegrationExecutionProvider.CUSTOM_WEBHOOK,
              action: IntegrationExecutionAction.SEND_WEBHOOK,
            },
            {
              provider: IntegrationExecutionProvider.WORDPRESS,
              action: IntegrationExecutionAction.PUBLISH,
            },
          ],
        },
        ...(input.ignoreSchedule
          ? []
          : [{ OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }]),
      ],
      sourceId: input.articleId,
      organizationId: input.organizationId,
      sourceType: IntegrationExecutionSourceType.ARTICLE,
      status: {
        in: [
          IntegrationExecutionStatus.WAITING,
          IntegrationExecutionStatus.RETRYING,
        ],
      },
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true },
  });

  const report: PublicationVerificationRunReport = {
    scanned: dueJobs.length,
    claimed: 0,
    verified: 0,
    rescheduled: 0,
    failed: 0,
  };

  for (const candidate of dueJobs) {
    const startedAt = Date.now();
    const job = await claimDueExecutionJob(candidate.id, now);
    if (!job) continue;
    report.claimed += 1;

    const article = await prisma.article.findFirst({
      where: {
        id: job.sourceId,
        websiteId: job.websiteId,
        organizationId: job.organizationId,
        deletedAt: null,
      },
      select: { id: true, title: true, contentHtml: true },
    });

    const verification =
      article?.contentHtml && job.externalUrl
        ? await verifyPublishedPage({
            publicUrl: job.externalUrl,
            expectedTitle: article.title,
            expectedContentHtml: article.contentHtml,
          })
        : {
            verified: false,
            statusCode: null,
            finalUrl: null,
            errorCode: article ? "missing_public_url" : "article_not_found",
            checks: {
              statusOk: false,
              titleFound: false,
              contentMarkerFound: false,
              canonicalMatches: false,
              indexable: false,
              robotsAllowed: false,
              sitemapContainsUrl: false,
            },
            sitemapUrl: null,
          };

    await recordPublishAttempt({
      jobId: job.id,
      attemptNumber: job.attemptCount,
      phase: "verification",
      outcome: verification.verified ? "verified" : "not_ready",
      statusCode: verification.statusCode,
      errorCode: verification.errorCode,
      verification: verification.checks,
    });

    if (verification.verified && article) {
      const publishedAt = new Date();
      await prisma.article.update({
        where: { id: article.id },
        data: {
          status: ArticleStatus.PUBLISHED,
          publishedAt,
          wordpressPublishedUrl: job.externalUrl,
        },
      });
      await markArticlePublishedInMonthlyPlans({
        articleId: article.id,
        websiteId: job.websiteId,
        publishedAt,
        publishingPath:
          job.provider === IntegrationExecutionProvider.WORDPRESS
            ? "wordpress_live"
            : "webhook",
      });
      await markExecutionJobSucceeded({
        jobId: job.id,
        externalId: job.externalId,
        externalUrl: job.externalUrl,
        result: {
          ...asRecord(job.resultJson),
          publishedBy:
            job.provider === IntegrationExecutionProvider.WORDPRESS
              ? "wordpress"
              : "custom_webhook",
          verifiedAt: publishedAt.toISOString(),
        },
        verification: {
          ...verification.checks,
          statusCode: verification.statusCode,
          finalUrl: verification.finalUrl,
          sitemapUrl: verification.sitemapUrl,
        },
      });
      await prisma.activity.create({
        data: {
          organizationId: job.organizationId,
          websiteId: job.websiteId,
          userId: job.requestedByUserId,
          type: ActivityType.ARTICLE_VALIDATED,
          title: "Article published and verified",
          description: article.title,
          metadataJson: {
            articleId: article.id,
            jobId: job.id,
            externalUrl: job.externalUrl,
            verifiedAt: publishedAt.toISOString(),
          },
        },
      });
      report.verified += 1;
      safeLogInfo("publication.verify", "Publication verified", {
        siteId: job.websiteId,
        actionId: job.sourceId,
        jobId: job.id,
        integrationId: job.integrationId,
        type: job.provider,
        status: "SUCCEEDED",
        durationMs: Date.now() - startedAt,
        error: null,
      });
      continue;
    }

    if (
      hasPublicationVerificationAttemptsRemaining({
        attemptCount: job.attemptCount,
        maxAttempts: job.maxRetries,
      })
    ) {
      await markExecutionJobWaiting({
        jobId: job.id,
        nextAttemptAt: nextPublicationVerificationAt(now, job.attemptCount),
        result: asRecord(job.resultJson),
        verification: {
          ...verification.checks,
          errorCode: verification.errorCode,
          lastCheckedAt: now.toISOString(),
        },
        externalId: job.externalId,
        externalUrl: job.externalUrl,
        incrementRetry: true,
        message: "Public URL is not ready yet; verification will retry.",
      });
      report.rescheduled += 1;
      safeLogWarn("publication.verify", "Publication verification rescheduled", {
        siteId: job.websiteId,
        actionId: job.sourceId,
        jobId: job.id,
        integrationId: job.integrationId,
        type: job.provider,
        status: "WAITING",
        durationMs: Date.now() - startedAt,
        error: verification.errorCode,
      });
      continue;
    }

    if (article) {
      await prisma.article.update({
        where: { id: article.id },
        data: { status: ArticleStatus.FAILED, publishedAt: null },
      });
      await markArticlePublicationFailedInMonthlyPlans({
        articleId: article.id,
        websiteId: job.websiteId,
        reasonKey: "publishVerificationFailed",
      });
    }
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: "PUBLISH_VERIFICATION_FAILED",
      errorMessage:
        "The publishing endpoint accepted the article, but the public page could not be verified.",
      result: {
        ...asRecord(job.resultJson),
        verification: verification.checks,
      },
    });
    report.failed += 1;
    safeLogWarn("publication.verify", "Publication verification failed", {
      siteId: job.websiteId,
      actionId: job.sourceId,
      jobId: job.id,
      integrationId: job.integrationId,
      type: job.provider,
      status: "FAILED",
      durationMs: Date.now() - startedAt,
      error: verification.errorCode,
    });
  }

  return report;
}
