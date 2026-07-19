import {
  ActivityType,
  ArticleStatus,
  WordPressConnectionStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { safeLogError } from "@/lib/logging";
import { trackEventFireAndForget } from "@/lib/analytics/track";
import { assertCanUseFeature } from "@/lib/billing/feature-gates";
import {
  getWordPressConnectionWithSecret,
  normalizeSiteUrl,
} from "@/lib/integrations/wordpress-connector";
import { getApplicationPasswordCredentials } from "@/lib/integrations/wordpress/connect-application-password";
import { assertSafeWordPressUrl } from "@/lib/integrations/wordpress/normalize-url";
import { createWordPressRestDraft } from "@/lib/integrations/wordpress/rest-client";
import { canCreateWordPressDraftForQuality } from "@/lib/integrations/wordpress/draft-eligibility";

export type WordPressDraftResult = {
  postId: string;
  editUrl: string;
  articleId: string;
  status: ArticleStatus;
};

type WordPressDraftApiResponse = {
  success?: boolean;
  postId?: number;
  editUrl?: string;
  message?: string;
  error?: {
    message?: string;
  };
};

function mapArticleLanguage(language: string): string {
  return language.toLowerCase();
}

function buildWordPressDraftUrl(siteUrl: string): string {
  return `${normalizeSiteUrl(siteUrl)}/wp-json/rankboost/v1/drafts`;
}

function parseWordPressDraftResponse(
  statusCode: number,
  body: unknown
): { postId: string; editUrl: string } {
  const data = body as WordPressDraftApiResponse;

  if (statusCode === 401) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "WordPress отклонил Shared Secret. Проверьте настройки плагина."
    );
  }

  if (statusCode === 403) {
    throw new AppError(
      ErrorCode.CONFLICT,
      "WordPress не подключён. Нажмите «Проверить соединение» в плагине."
    );
  }

  if (statusCode < 200 || statusCode >= 300) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error?.message === "string"
          ? data.error.message
          : `WordPress вернул HTTP ${statusCode}.`;
    throw new AppError(ErrorCode.INTERNAL_ERROR, message);
  }

  if (!data?.success || typeof data.postId !== "number" || !data.editUrl) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "WordPress вернул неожиданный ответ при создании черновика."
    );
  }

  return {
    postId: String(data.postId),
    editUrl: data.editUrl,
  };
}

async function persistWordPressDraftResult(input: {
  articleId: string;
  organizationId: string;
  websiteId: string;
  userId: string;
  title: string;
  postId: string;
  editUrl: string;
}): Promise<void> {
  const prisma = getPrisma();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.article.update({
      where: { id: input.articleId },
      data: {
        status: ArticleStatus.WORDPRESS_DRAFT_CREATED,
        wordpressPostId: input.postId,
        wordpressEditUrl: input.editUrl,
      },
    });

    await tx.wordPressConnection.updateMany({
      where: {
        websiteId: input.websiteId,
        status: WordPressConnectionStatus.CONNECTED,
        disconnectedAt: null,
      },
      data: {
        lastDraftCreatedAt: now,
      },
    });

    await tx.activity.create({
      data: {
        organizationId: input.organizationId,
        websiteId: input.websiteId,
        userId: input.userId,
        type: ActivityType.ARTICLE_DRAFT_CREATED,
        title: "Черновик создан в WordPress",
        description: `Статья «${input.title}» отправлена в WordPress как draft.`,
        metadataJson: {
          articleId: input.articleId,
          wordpressPostId: input.postId,
          editUrl: input.editUrl,
        },
      },
    });
  });

  try {
    const { timelineAfterWordPressDraftCreated } = await import(
      "@/lib/timeline/hooks"
    );
    await timelineAfterWordPressDraftCreated({
      userId: input.userId,
      websiteId: input.websiteId,
      articleId: input.articleId,
      title: input.title,
    });
  } catch {
    // Timeline sync must not block WordPress draft creation.
  }

  trackEventFireAndForget({
    event: "wordpress_draft_created",
    userId: input.userId,
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    properties: {
      articleId: input.articleId,
      integration: "wordpress",
      status: "created",
    },
  });
}

/**
 * Creates a WordPress draft post for an Article owned by the user.
 * Supports Application Password (native REST) and legacy plugin connector.
 * Never live-publishes.
 */
export async function createWordPressDraftForArticle({
  articleId,
  userId,
}: {
  articleId: string;
  userId: string;
}): Promise<WordPressDraftResult> {
  const prisma = getPrisma();

  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
      deletedAt: null,
      organization: {
        ownerUserId: userId,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      websiteId: true,
      organizationId: true,
      title: true,
      slug: true,
      language: true,
      status: true,
      qualityPassed: true,
      metaTitle: true,
      metaDescription: true,
      contentHtml: true,
      wordpressPostId: true,
    },
  });

  if (!article) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья не найдена");
  }

  await assertCanUseFeature({
    userId,
    organizationId: article.organizationId,
    feature: "wordpress",
    message:
      "WordPress draft creation is not available on your current plan. Upgrade to continue.",
  });

  // Quality-failed articles must not create WP drafts.
  if (
    !canCreateWordPressDraftForQuality({
      qualityPassed: article.qualityPassed,
      status: article.status,
    })
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      article.qualityPassed === false
        ? "Статья не прошла проверку качества — черновик WordPress нельзя создать."
        : "В WordPress можно отправить только статью со статусом DRAFT, APPROVED или качественный WAITING_REVIEW."
    );
  }

  if (article.wordpressPostId) {
    throw new AppError(
      ErrorCode.CONFLICT,
      "Черновик WordPress для этой статьи уже создан."
    );
  }

  const contentHtml = article.contentHtml?.trim();
  if (!contentHtml) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "У статьи нет contentHtml — добавьте содержимое перед отправкой в WordPress."
    );
  }

  const appPw = await getApplicationPasswordCredentials(article.websiteId);
  if (appPw) {
    if (!appPw.permissions.canCreateDrafts) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "WordPress-подключение не разрешает создание черновиков."
      );
    }

    const result = await createWordPressRestDraft(
      {
        siteUrl: appPw.siteUrl,
        username: appPw.username,
        applicationPassword: appPw.applicationPassword,
      },
      {
        title: article.title,
        contentHtml,
        excerpt: article.metaDescription ?? "",
        slug: article.slug,
        status: "draft",
        categories: appPw.permissions.defaultCategoryIds,
        author: appPw.permissions.defaultAuthorId,
      }
    );

    await persistWordPressDraftResult({
      articleId: article.id,
      organizationId: article.organizationId,
      websiteId: article.websiteId,
      userId,
      title: article.title,
      postId: result.postId,
      editUrl: result.editUrl,
    });

    return {
      postId: result.postId,
      editUrl: result.editUrl,
      articleId: article.id,
      status: ArticleStatus.WORDPRESS_DRAFT_CREATED,
    };
  }

  const { connection, apiSecret } = await getWordPressConnectionWithSecret({
    websiteId: article.websiteId,
  });

  if (!connection.permissions.canCreateDrafts) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      "WordPress-подключение не разрешает создание черновиков."
    );
  }

  await assertSafeWordPressUrl(connection.siteUrl);

  const draftUrl = buildWordPressDraftUrl(connection.siteUrl);
  const payload = {
    title: article.title,
    contentHtml,
    metaTitle: article.metaTitle ?? article.title,
    metaDescription: article.metaDescription ?? "",
    slug: article.slug ?? undefined,
    language: mapArticleLanguage(article.language),
  };

  let response: Response;
  try {
    response = await fetch(draftUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RankBoost-Secret": apiSecret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
      redirect: "manual",
    });
  } catch (error) {
    safeLogError("wordpress.draft", error, {
      articleId,
      websiteId: article.websiteId,
    });
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "WordPress не ответил за 15 секунд."
        : "Не удалось связаться с WordPress.";
    throw new AppError(ErrorCode.INTERNAL_ERROR, message);
  }

  let responseBody: unknown = null;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  const { postId, editUrl } = parseWordPressDraftResponse(
    response.status,
    responseBody
  );

  await persistWordPressDraftResult({
    articleId: article.id,
    organizationId: article.organizationId,
    websiteId: article.websiteId,
    userId,
    title: article.title,
    postId,
    editUrl,
  });

  return {
    postId,
    editUrl,
    articleId: article.id,
    status: ArticleStatus.WORDPRESS_DRAFT_CREATED,
  };
}

export { canCreateWordPressDraftForQuality };
