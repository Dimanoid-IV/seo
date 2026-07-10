import "server-only";

import {
  ArticleStatus,
  EmailApprovalStatus,
  SocialPostStatus,
  TaskStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { approveArticleForAutopilot } from "@/lib/articles/approve-article-for-autopilot";
import { updateArticleForUser } from "@/lib/articles/article-actions";
import { getPrisma } from "@/lib/db";
import { archiveEmailApproval, updateEmailApproval } from "@/lib/email-approvals/update-email-approval";
import { AppError, ErrorCode } from "@/lib/errors";
import { updateSocialPost } from "@/lib/social-posts/update-social-post";
import { completeTask } from "@/lib/tasks/task-actions";
import {
  parseTaskRecommendationWithFix,
  updatePreparedFixStatus,
} from "@/lib/tasks/prepared-fix";

import type { ReviewAction, ReviewItemType } from "./types";

type ReviewActionInput = {
  currentUser: CurrentUser;
  itemType: ReviewItemType;
  sourceId: string;
  action: ReviewAction;
  content?: string;
};

export async function applyReviewAction(input: ReviewActionInput) {
  switch (input.itemType) {
    case "EMAIL_DRAFT":
      return applyEmailAction(input);
    case "ARTICLE_DRAFT":
      return applyArticleAction(input);
    case "SOCIAL_POST":
      return applySocialAction(input);
    case "META_FIX":
    case "SEO_FIX":
    case "TASK_FIX":
      return applyTaskFixAction(input);
    default:
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Unknown review item type");
  }
}

async function applyEmailAction(input: ReviewActionInput) {
  if (input.action === "APPROVE") {
    return updateEmailApproval({
      emailApprovalId: input.sourceId,
      userId: input.currentUser.id,
      data: { status: EmailApprovalStatus.APPROVED },
    });
  }

  if (input.action === "REJECT") {
    return archiveEmailApproval({
      emailApprovalId: input.sourceId,
      userId: input.currentUser.id,
    });
  }

  if (input.action === "EDIT" && input.content) {
    return updateEmailApproval({
      emailApprovalId: input.sourceId,
      userId: input.currentUser.id,
      data: { body: input.content },
    });
  }

  throw new AppError(
    ErrorCode.VALIDATION_ERROR,
    "This action is not supported for email drafts"
  );
}

async function applyArticleAction(input: ReviewActionInput) {
  if (input.action === "APPROVE") {
    return approveArticleForAutopilot({
      articleId: input.sourceId,
      currentUser: input.currentUser,
    });
  }

  if (input.action === "REJECT") {
    const prisma = getPrisma();
    const article = await prisma.article.findFirst({
      where: {
        id: input.sourceId,
        deletedAt: null,
        website: {
          organization: {
            ownerUserId: input.currentUser.id,
            deletedAt: null,
          },
        },
      },
      select: { id: true },
    });

    if (!article) {
      throw new AppError(ErrorCode.NOT_FOUND, "Article not found");
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { status: ArticleStatus.ARCHIVED },
    });

    return { articleId: article.id, status: "ARCHIVED" as const };
  }

  if (input.action === "EDIT" && input.content) {
    return updateArticleForUser({
      articleId: input.sourceId,
      currentUser: input.currentUser,
      data: { contentHtml: input.content },
    });
  }

  if (input.action === "MARK_DONE") {
    return approveArticleForAutopilot({
      articleId: input.sourceId,
      currentUser: input.currentUser,
    });
  }

  throw new AppError(
    ErrorCode.VALIDATION_ERROR,
    "This action is not supported for article drafts"
  );
}

async function applySocialAction(input: ReviewActionInput) {
  if (input.action === "APPROVE") {
    return updateSocialPost({
      socialPostId: input.sourceId,
      userId: input.currentUser.id,
      data: { status: SocialPostStatus.APPROVED },
    });
  }

  if (input.action === "REJECT") {
    return updateSocialPost({
      socialPostId: input.sourceId,
      userId: input.currentUser.id,
      data: { status: SocialPostStatus.ARCHIVED },
    });
  }

  if (input.action === "EDIT" && input.content) {
    return updateSocialPost({
      socialPostId: input.sourceId,
      userId: input.currentUser.id,
      data: { content: input.content },
    });
  }

  throw new AppError(
    ErrorCode.VALIDATION_ERROR,
    "This action is not supported for social posts"
  );
}

async function applyTaskFixAction(input: ReviewActionInput) {
  const prisma = getPrisma();

  const task = await prisma.task.findFirst({
    where: {
      id: input.sourceId,
      deletedAt: null,
      organization: {
        ownerUserId: input.currentUser.id,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      recommendationJson: true,
      status: true,
    },
  });

  if (!task) {
    throw new AppError(ErrorCode.NOT_FOUND, "Task not found");
  }

  const parsed = parseTaskRecommendationWithFix(task.recommendationJson);
  if (!parsed.preparedFix) {
    throw new AppError(ErrorCode.NOT_FOUND, "Prepared fix not found");
  }

  if (input.action === "APPROVE") {
    const recommendationJson = updatePreparedFixStatus(
      task.recommendationJson,
      "APPROVED"
    );

    if (!recommendationJson) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Could not update prepared fix");
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { recommendationJson: recommendationJson as Prisma.InputJsonValue },
    });

    return { taskId: task.id, status: "APPROVED" as const };
  }

  if (input.action === "REJECT") {
    const recommendationJson = updatePreparedFixStatus(
      task.recommendationJson,
      "REJECTED"
    );

    if (!recommendationJson) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Could not update prepared fix");
    }

    await prisma.task.update({
      where: { id: task.id },
      data: {
        recommendationJson: recommendationJson as Prisma.InputJsonValue,
        status:
          task.status === TaskStatus.WAITING_REVIEW
            ? TaskStatus.IN_PROGRESS
            : task.status,
      },
    });

    return { taskId: task.id, status: "REJECTED" as const };
  }

  if (input.action === "EDIT" && input.content) {
    const recommendationJson = updatePreparedFixStatus(
      task.recommendationJson,
      parsed.preparedFix.status,
      {
        preview: input.content,
        suggestedValue: input.content,
        summary: input.content.slice(0, 180),
      }
    );

    if (!recommendationJson) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Could not update prepared fix");
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { recommendationJson: recommendationJson as Prisma.InputJsonValue },
    });

    return { taskId: task.id, status: "EDITED" as const };
  }

  if (input.action === "MARK_DONE") {
    await completeTask({
      taskId: task.id,
      currentUser: input.currentUser,
    });

    const recommendationJson = updatePreparedFixStatus(
      task.recommendationJson,
      "APPROVED"
    );

    if (recommendationJson) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          recommendationJson: recommendationJson as Prisma.InputJsonValue,
        },
      });
    }

    return { taskId: task.id, status: "COMPLETED" as const };
  }

  throw new AppError(
    ErrorCode.VALIDATION_ERROR,
    "This action is not supported for prepared fixes"
  );
}
