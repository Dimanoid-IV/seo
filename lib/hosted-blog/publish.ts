import "server-only";

import { ActivityType, ArticleStatus } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { buildHostedArticleUrl } from "@/lib/hosted-blog/urls";

export async function publishArticleToHostedBlog({
  articleId,
  currentUser,
}: {
  articleId: string;
  currentUser: CurrentUser;
}): Promise<{ articleId: string; hostedUrl: string; alreadyPublished: boolean }> {
  const prisma = getPrisma();
  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
      deletedAt: null,
      organization: {
        ownerUserId: currentUser.id,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      websiteId: true,
      organizationId: true,
      title: true,
      slug: true,
      status: true,
      qualityPassed: true,
      wordpressPostId: true,
      wordpressPublishedUrl: true,
    },
  });

  if (!article) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья не найдена.");
  }

  if (article.wordpressPostId) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Эта статья уже связана с WordPress. Используйте WordPress-публикацию."
    );
  }

  if (article.qualityPassed !== true) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Публикация доступна только для статьи, которая прошла проверку качества."
    );
  }

  const hostedUrl = buildHostedArticleUrl({
    articleId: article.id,
    slug: article.slug,
    title: article.title,
  });

  if (article.status === ArticleStatus.PUBLISHED) {
    if (article.wordpressPublishedUrl && article.wordpressPublishedUrl !== hostedUrl) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Статья уже опубликована через другую интеграцию."
      );
    }
    return { articleId: article.id, hostedUrl, alreadyPublished: true };
  }

  const publishableStatuses: ArticleStatus[] = [
      ArticleStatus.WAITING_REVIEW,
      ArticleStatus.APPROVED,
      ArticleStatus.WORDPRESS_DRAFT_CREATED,
      ArticleStatus.DRAFT,
    ];

  if (!publishableStatuses.includes(article.status)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Этот статус статьи нельзя опубликовать."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.article.update({
      where: { id: article.id },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        wordpressPublishedUrl: hostedUrl,
      },
    });

    await tx.activity.create({
      data: {
        organizationId: article.organizationId,
        websiteId: article.websiteId,
        userId: currentUser.id,
        type: ActivityType.SYSTEM_NOTICE,
        title: "Статья опубликована на RankBoost Hosted Blog",
        description: article.title,
        metadataJson: {
          articleId: article.id,
          hostedUrl,
          provider: "RANKBOOST_HOSTED_BLOG",
        },
      },
    });
  });

  return { articleId: article.id, hostedUrl, alreadyPublished: false };
}
