import "server-only";

import { ActivityType, ArticleStatus } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  parsePlanItemsDocument,
  planItemsToJson,
} from "@/lib/autopilot/plan-items";
import { updatePlanItemsForArticleApproval } from "@/lib/autopilot/link-article-approval";

export type ApproveArticleForAutopilotResult = {
  articleId: string;
  status: ArticleStatus;
  alreadyApproved: boolean;
  linkedPlanItems: Array<{ planId: string; planItemId: string }>;
  noPlanItemLinked: boolean;
};

const APPROVABLE_STATUSES = new Set<ArticleStatus>([
  ArticleStatus.WAITING_REVIEW,
  ArticleStatus.APPROVED,
]);

function assertArticleEligibleForApproval(article: {
  status: ArticleStatus;
  qualityPassed: boolean | null;
}): void {
  if (article.qualityPassed === false) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "This article did not pass quality checks and cannot be approved yet."
    );
  }

  if (
    article.status === ArticleStatus.DRAFT ||
    article.status === ArticleStatus.IDEA
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "This article draft is not ready for approval. Revise it first."
    );
  }

  if (!APPROVABLE_STATUSES.has(article.status)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "This article cannot be approved in its current state."
    );
  }
}

/**
 * Approves a generated article from Review Queue and links autopilot plan items.
 * Never publishes externally.
 */
export async function approveArticleForAutopilot(input: {
  articleId: string;
  currentUser: CurrentUser;
}): Promise<ApproveArticleForAutopilotResult> {
  const prisma = getPrisma();

  const article = await prisma.article.findFirst({
    where: {
      id: input.articleId,
      deletedAt: null,
      organization: {
        ownerUserId: input.currentUser.id,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      qualityPassed: true,
      approvedAt: true,
      websiteId: true,
      organizationId: true,
    },
  });

  if (!article) {
    throw new AppError(ErrorCode.NOT_FOUND, "Article not found");
  }

  const alreadyApproved = article.status === ArticleStatus.APPROVED;

  if (!alreadyApproved) {
    assertArticleEligibleForApproval(article);
  }

  const approvedAt = article.approvedAt ?? new Date();
  const linkedPlanItems: ApproveArticleForAutopilotResult["linkedPlanItems"] =
    [];

  await prisma.$transaction(async (tx) => {
    if (!alreadyApproved) {
      await tx.article.update({
        where: { id: article.id },
        data: {
          status: ArticleStatus.APPROVED,
          approvedAt,
        },
      });

      await tx.activity.create({
        data: {
          organizationId: article.organizationId,
          websiteId: article.websiteId,
          userId: input.currentUser.id,
          type: ActivityType.SYSTEM_NOTICE,
          title: "Article approved",
          description: article.title,
          metadataJson: {
            articleId: article.id,
            source: "review_queue",
          },
        },
      });
    }

    const plans = await tx.monthlyAutopilotPlan.findMany({
      where: {
        userId: input.currentUser.id,
        organizationId: article.organizationId,
        websiteId: article.websiteId,
        archivedAt: null,
      },
      select: {
        id: true,
        planItemsJson: true,
      },
    });

    for (const plan of plans) {
      const document = plan.planItemsJson
        ? parsePlanItemsDocument(plan.planItemsJson)
        : null;

      if (!document) {
        continue;
      }

      const { document: updatedDocument, matchedItemIds } =
        updatePlanItemsForArticleApproval(
          document,
          article.id,
          approvedAt.toISOString()
        );

      if (matchedItemIds.length === 0) {
        continue;
      }

      await tx.monthlyAutopilotPlan.update({
        where: { id: plan.id },
        data: {
          planItemsJson: planItemsToJson(updatedDocument),
        },
      });

      for (const planItemId of matchedItemIds) {
        linkedPlanItems.push({ planId: plan.id, planItemId });
      }
    }
  });

  return {
    articleId: article.id,
    status: ArticleStatus.APPROVED,
    alreadyApproved,
    linkedPlanItems,
    noPlanItemLinked: linkedPlanItems.length === 0,
  };
}
