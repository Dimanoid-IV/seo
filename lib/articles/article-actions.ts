import {
  ActivityType,
  ArticleStatus,
} from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import type { ArticleUpdateInput, SerializedArticle } from "./types";
import {
  isWordPressConnectedForWebsite,
  serializeArticleRecord,
} from "./article-serialize";

const ARTICLE_SELECT = {
  id: true,
  websiteId: true,
  organizationId: true,
  title: true,
  slug: true,
  language: true,
  status: true,
  topic: true,
  targetKeyword: true,
  metaTitle: true,
  metaDescription: true,
  contentHtml: true,
  faqJson: true,
  schemaJson: true,
  wordpressPostId: true,
  wordpressEditUrl: true,
  generatedByAIJobId: true,
  qualityScore: true,
  qualityPassed: true,
  qualityIssuesJson: true,
  qualityRepairAttempts: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const EDITABLE_STATUSES: ArticleStatus[] = [
  ArticleStatus.IDEA,
  ArticleStatus.DRAFT,
  ArticleStatus.WAITING_REVIEW,
  ArticleStatus.APPROVED,
  ArticleStatus.ARCHIVED,
];

async function findArticleForUser(articleId: string, userId: string) {
  const prisma = getPrisma();

  return prisma.article.findFirst({
    where: {
      id: articleId,
      deletedAt: null,
      organization: {
        ownerUserId: userId,
        deletedAt: null,
      },
    },
    select: ARTICLE_SELECT,
  });
}

function normalizeSlug(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseEditableStatus(value: string): ArticleStatus {
  const upper = value.toUpperCase() as ArticleStatus;

  if (!EDITABLE_STATUSES.includes(upper)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Недопустимый статус статьи для редактирования."
    );
  }

  return upper;
}

/**
 * Loads an article owned by the current user.
 */
export async function getArticleForUser({
  articleId,
  currentUser,
}: {
  articleId: string;
  currentUser: CurrentUser;
}): Promise<SerializedArticle> {
  const article = await findArticleForUser(articleId, currentUser.id);

  if (!article) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья не найдена");
  }

  const wordpressConnected = await isWordPressConnectedForWebsite(
    article.websiteId
  );

  return serializeArticleRecord(article, wordpressConnected);
}

/**
 * Updates editable article fields for the current user.
 */
export async function updateArticleForUser({
  articleId,
  currentUser,
  data,
}: {
  articleId: string;
  currentUser: CurrentUser;
  data: ArticleUpdateInput;
}): Promise<SerializedArticle> {
  const prisma = getPrisma();
  const existing = await findArticleForUser(articleId, currentUser.id);

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья не найдена");
  }

  const updateData: {
    title?: string;
    slug?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    contentHtml?: string | null;
    status?: ArticleStatus;
    approvedAt?: Date | null;
  } = {};

  if (data.title !== undefined) {
    const title = data.title.trim();
    if (!title) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Заголовок не может быть пустым.");
    }
    updateData.title = title;
  }

  if (data.slug !== undefined) {
    updateData.slug = normalizeSlug(data.slug);
  }

  if (data.metaTitle !== undefined) {
    updateData.metaTitle =
      data.metaTitle === null ? null : data.metaTitle.trim() || null;
  }

  if (data.metaDescription !== undefined) {
    updateData.metaDescription =
      data.metaDescription === null
        ? null
        : data.metaDescription.trim() || null;
  }

  if (data.contentHtml !== undefined) {
    updateData.contentHtml = data.contentHtml;
  }

  let approved = false;
  if (data.status !== undefined) {
    const nextStatus = parseEditableStatus(data.status);
    if (
      nextStatus === ArticleStatus.APPROVED &&
      existing.generatedByAIJobId &&
      existing.qualityPassed === false
    ) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Черновик не прошёл проверку качества. Доработайте его перед одобрением."
      );
    }
    updateData.status = nextStatus;

    if (nextStatus === ArticleStatus.APPROVED && existing.status !== ArticleStatus.APPROVED) {
      updateData.approvedAt = new Date();
      approved = true;
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Нет полей для обновления.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const article = await tx.article.update({
      where: { id: existing.id },
      data: updateData,
      select: ARTICLE_SELECT,
    });

    await tx.activity.create({
      data: {
        organizationId: article.organizationId,
        websiteId: article.websiteId,
        userId: currentUser.id,
        type: ActivityType.SYSTEM_NOTICE,
        title: "Статья обновлена",
        description: article.title,
        metadataJson: {
          articleId: article.id,
          status: article.status,
        },
      },
    });

    if (approved) {
      await tx.activity.create({
        data: {
          organizationId: article.organizationId,
          websiteId: article.websiteId,
          userId: currentUser.id,
          type: ActivityType.SYSTEM_NOTICE,
          title: "Статья одобрена",
          description: article.title,
          metadataJson: {
            articleId: article.id,
          },
        },
      });
    }

    return article;
  });

  if (
    updateData.status === ArticleStatus.ARCHIVED &&
    existing.status !== ArticleStatus.ARCHIVED
  ) {
    try {
      const { reconcileArticleDraftUsage } = await import(
        "@/lib/billing/article-usage"
      );
      const { getCurrentSubscription } = await import(
        "@/lib/billing/get-subscription"
      );
      const subscription = await getCurrentSubscription({
        userId: currentUser.id,
        organizationId: updated.organizationId,
      });
      await reconcileArticleDraftUsage({
        userId: currentUser.id,
        organizationId: updated.organizationId,
        websiteId: updated.websiteId,
        planLimitId: subscription.planLimit?.id ?? null,
      });
    } catch {
      // Snapshot reconcile must not block article updates.
    }
  }

  const wordpressConnected = await isWordPressConnectedForWebsite(
    updated.websiteId
  );

  return serializeArticleRecord(updated, wordpressConnected);
}
