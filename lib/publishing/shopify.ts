import "server-only";

import {
  ArticleStatus,
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
} from "@prisma/client";

import { loadBrandKitForWebsite } from "@/lib/brand-kit";
import { evaluateCurrentArticlePublishQuality } from "@/lib/articles/publish-quality";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { IntegrationCapability } from "@/lib/integrations/adapters/capabilities";
import {
  appendIntegrationExecutionEvent,
  createIntegrationExecutionJob,
  markExecutionJobFailed,
  markExecutionJobRunning,
  markExecutionJobSucceeded,
} from "@/lib/integrations/execution-jobs";
import { buildUniversalExport } from "@/lib/publishing/universal-export";
import {
  getShopifyPublishingConfig,
  getShopifyToken,
  isSafeShopifyDomain,
  normalizeShopifyDomain,
  type ShopifyPublishingConfig,
} from "@/lib/publishing/shopify-config";

const SHOPIFY_API_VERSION = "2026-07";
const TIMEOUT_MS = 15_000;

export type ShopifyConnectionTestResult = {
  ok: boolean;
  statusCode: number;
  shopDomain: string;
  blogId: string;
  shopName: string | null;
  blogTitle: string | null;
  error: string | null;
};

export type ShopifyPublishResult = {
  dryRun: boolean;
  created: boolean;
  articleId: string | null;
  articleUrl: string | null;
  jobId?: string;
};

type ShopifyGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

function endpoint(shopDomain: string): string {
  return `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

async function shopifyGraphql<T>(
  shopDomain: string,
  token: string,
  query: string,
  variables: Record<string, unknown>
): Promise<{ response: Response; body: ShopifyGraphqlResponse<T> | null }> {
  const response = await fetch(endpoint(shopDomain), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Shopify-Access-Token": token,
      "User-Agent": "RankBoost-Shopify/1.0",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "manual",
  });

  let body: ShopifyGraphqlResponse<T> | null = null;
  try {
    body = (await response.json()) as ShopifyGraphqlResponse<T>;
  } catch {
    body = null;
  }
  return { response, body };
}

export async function testShopifyConnection(input: {
  shopDomain: string;
  blogId: string;
  token: string;
}): Promise<ShopifyConnectionTestResult> {
  const shopDomain = normalizeShopifyDomain(input.shopDomain);
  const blogId = input.blogId.trim();
  if (!isSafeShopifyDomain(shopDomain) || !blogId || !input.token.trim()) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Укажите myshopify.com domain, blogId и Admin API token."
    );
  }

  const { response, body } = await shopifyGraphql<{
    shop?: { name?: string; myshopifyDomain?: string };
    blog?: { id?: string; title?: string; handle?: string };
  }>(
    shopDomain,
    input.token,
    `query RankBoostShopifyConnection($blogId: ID!) {
      shop { name myshopifyDomain }
      blog: node(id: $blogId) {
        ... on Blog { id title handle }
      }
    }`,
    { blogId }
  );

  const shopMatches =
    !body?.data?.shop?.myshopifyDomain ||
    normalizeShopifyDomain(body.data.shop.myshopifyDomain) === shopDomain;
  const blogMatches = body?.data?.blog?.id === blogId;
  const ok = response.ok && !body?.errors?.length && shopMatches && blogMatches;
  return {
    ok,
    statusCode: response.status,
    shopDomain,
    blogId,
    shopName:
      typeof body?.data?.shop?.name === "string" ? body.data.shop.name : null,
    blogTitle:
      typeof body?.data?.blog?.title === "string" ? body.data.blog.title : null,
    error: ok
      ? null
      : body?.errors?.[0]?.message ??
        (response.ok
          ? "Blog was not found for this Shopify shop."
          : `Shopify returned HTTP ${response.status}.`),
  };
}

function safeHandle(value: string | null | undefined, fallback: string): string {
  return (
    (value ?? fallback)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 90) || "rankboost-article"
  );
}

function parseShopifyNumericId(gid: string | null | undefined): string | null {
  const match = gid?.match(/\/(\d+)$/);
  return match?.[1] ?? null;
}

async function createShopifyBlogArticle(input: {
  config: ShopifyPublishingConfig;
  token: string;
  title: string;
  handle: string;
  html: string;
  summary: string | null;
  authorName: string | null;
  tags: string[];
  publishLive: boolean;
}): Promise<{ id: string; url: string | null; handle: string | null }> {
  const { response, body } = await shopifyGraphql<{
    articleCreate?: {
      article?: { id?: string; handle?: string; onlineStoreUrl?: string | null };
      userErrors?: Array<{ field?: string[]; message?: string }>;
    };
  }>(
    input.config.shopDomain,
    input.token,
    `mutation RankBoostArticleCreate($article: ArticleCreateInput!) {
      articleCreate(article: $article) {
        article { id handle onlineStoreUrl }
        userErrors { field message }
      }
    }`,
    {
      article: {
        blogId: input.config.blogId,
        title: input.title,
        handle: input.handle,
        body: input.html,
        summary: input.summary ?? "",
        author: { name: input.authorName ?? "RankBoost" },
        tags: input.tags,
        isPublished: input.publishLive,
      },
    }
  );

  const userError = body?.data?.articleCreate?.userErrors?.[0]?.message;
  const article = body?.data?.articleCreate?.article;
  if (!response.ok || body?.errors?.length || userError || !article?.id) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      userError ??
        body?.errors?.[0]?.message ??
        `Shopify не создал blog article (HTTP ${response.status}).`
    );
  }
  return {
    id: article.id,
    url: article.onlineStoreUrl ?? null,
    handle: article.handle ?? null,
  };
}

export async function createShopifyArticleForArticle(input: {
  articleId: string;
  websiteId: string;
  organizationId: string;
  userId: string;
  dryRun?: boolean;
  publishLive?: boolean;
}): Promise<ShopifyPublishResult> {
  const prisma = getPrisma();
  const [article, website, config, token] = await Promise.all([
    prisma.article.findFirst({
      where: {
        id: input.articleId,
        websiteId: input.websiteId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        qualityPassed: true,
        targetKeyword: true,
        metaTitle: true,
        metaDescription: true,
        contentHtml: true,
        language: true,
      },
    }),
    prisma.website.findFirst({
      where: {
        id: input.websiteId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: { url: true },
    }),
    getShopifyPublishingConfig(input.websiteId),
    getShopifyToken(input.websiteId),
  ]);

  if (!article || !website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья или сайт не найдены.");
  }
  if (!config?.connected || !token) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Shopify не подключён.");
  }
  if (
    article.qualityPassed !== true ||
    !evaluateCurrentArticlePublishQuality(article).passed
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Shopify публикация доступна только после quality gate."
    );
  }
  if (!article.contentHtml?.trim()) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "У статьи нет контента.");
  }

  const brandKit = await loadBrandKitForWebsite(input.websiteId);
  const pkg = buildUniversalExport(
    {
      title: article.title,
      slug: article.slug,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      contentHtml: article.contentHtml,
      targetKeyword: article.targetKeyword,
      language: article.language,
    },
    { websiteUrl: website.url, brandKit }
  );
  const handle = safeHandle(article.slug, pkg.slug || article.title);
  const tags = ["rankboost"].concat(
    article.targetKeyword ? [article.targetKeyword] : []
  );

  const { job } = await createIntegrationExecutionJob({
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    requestedByUserId: input.userId,
    approvedByUserId: input.userId,
    sourceType: IntegrationExecutionSourceType.ARTICLE,
    sourceId: article.id,
    action: IntegrationExecutionAction.PUBLISH,
    provider: IntegrationExecutionProvider.SHOPIFY,
    mode: input.publishLive
      ? IntegrationExecutionMode.AUTO_PUBLISH
      : IntegrationExecutionMode.REVIEW_ONLY,
    capability: IntegrationCapability.ECOMMERCE_BLOG_PUBLISH,
    idempotencyKey: `shopify:blog-article:${article.id}`,
    requestPreview: {
      provider: "SHOPIFY",
      shopDomain: config.shopDomain,
      blogId: config.blogId,
      handle,
      title: article.title,
      publishLive: input.publishLive === true,
      contentLength: pkg.html.length,
    },
  });

  if (job.status === IntegrationExecutionStatus.SUCCEEDED) {
    return {
      dryRun: false,
      created: false,
      articleId: job.externalId,
      articleUrl: job.externalUrl,
      jobId: job.id,
    };
  }

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: "Shopify blog article creation queued.",
  });

  if (input.dryRun) {
    return {
      dryRun: true,
      created: false,
      articleId: null,
      articleUrl: null,
      jobId: job.id,
    };
  }

  await markExecutionJobRunning(job.id);
  try {
    const created = await createShopifyBlogArticle({
      config,
      token,
      title: article.title,
      handle,
      html: pkg.html,
      summary: article.metaDescription,
      authorName: config.authorName,
      tags,
      publishLive: input.publishLive === true,
    });
    const blogNumericId = parseShopifyNumericId(config.blogId);
    const articleNumericId = parseShopifyNumericId(created.id);
    const fallbackUrl =
      blogNumericId && articleNumericId
        ? `https://admin.shopify.com/store/${config.shopDomain.replace(
            ".myshopify.com",
            ""
          )}/content/blogs/${blogNumericId}/articles/${articleNumericId}`
        : `https://${config.shopDomain}/admin`;
    const articleUrl = created.url ?? fallbackUrl;

    await markExecutionJobSucceeded({
      jobId: job.id,
      externalId: created.id,
      externalUrl: articleUrl,
      result: {
        shopDomain: config.shopDomain,
        blogId: config.blogId,
        articleId: created.id,
        articleUrl,
        handle: created.handle,
        published: input.publishLive === true,
      },
    });

    await prisma.article.update({
      where: { id: article.id },
      data: {
        status:
          input.publishLive === true
            ? ArticleStatus.PUBLISHED
            : ArticleStatus.WAITING_REVIEW,
        wordpressPublishedUrl: articleUrl,
      },
    });

    return {
      dryRun: false,
      created: true,
      articleId: created.id,
      articleUrl,
      jobId: job.id,
    };
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "Shopify blog article creation failed.";
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: error instanceof AppError ? error.code : "shopify_failed",
      errorMessage: message,
    });
    throw error;
  }
}
