import "server-only";

import { SignJWT } from "jose";
import {
  ArticleStatus,
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
} from "@prisma/client";

import { assertSafeUrl } from "@/lib/audit/ssrf";
import { evaluateCurrentArticlePublishQuality } from "@/lib/articles/publish-quality";
import { loadBrandKitForWebsite } from "@/lib/brand-kit";
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
  getGhostAdminKey,
  getGhostPublishingConfig,
  normalizeGhostAdminUrl,
  parseGhostAdminKey,
  type GhostPublishingConfig,
} from "@/lib/publishing/ghost-config";

const TIMEOUT_MS = 15_000;

export type GhostConnectionTestResult = {
  ok: boolean;
  statusCode: number;
  adminUrl: string;
  siteTitle: string | null;
  error: string | null;
};

export type GhostPublishResult = {
  dryRun: boolean;
  created: boolean;
  postId: string | null;
  postUrl: string | null;
  jobId?: string;
};

type GhostPostResponse = {
  posts?: Array<{ id?: string; uuid?: string; slug?: string; url?: string | null }>;
};

type GhostSiteResponse = {
  site?: { title?: string; url?: string };
};

function ghostEndpoint(adminUrl: string, path: string): URL {
  const url = new URL(path, `${adminUrl}/`);
  return url;
}

async function createGhostJwt(adminKey: string): Promise<string> {
  const parsed = parseGhostAdminKey(adminKey);
  if (!parsed) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Ghost Admin API key должен быть в формате id:secret."
    );
  }
  const secret = Buffer.from(parsed.secret, "hex");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT", kid: parsed.id })
    .setIssuedAt(now)
    .setExpirationTime(now + 5 * 60)
    .setAudience("/admin/")
    .sign(secret);
}

async function ghostFetch<T>(
  adminUrl: string,
  adminKey: string,
  path: string,
  init: RequestInit = {}
): Promise<{ response: Response; body: T | null }> {
  const url = ghostEndpoint(adminUrl, path);
  await assertSafeUrl(url);
  const token = await createGhostJwt(adminKey);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Ghost ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "RankBoost-Ghost/1.0",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "manual",
  });
  let body: T | null = null;
  try {
    body = (await response.json()) as T;
  } catch {
    body = null;
  }
  return { response, body };
}

export async function testGhostConnection(input: {
  adminUrl: string;
  adminKey: string;
}): Promise<GhostConnectionTestResult> {
  const adminUrl = normalizeGhostAdminUrl(input.adminUrl);
  await assertSafeUrl(new URL(adminUrl));
  if (!parseGhostAdminKey(input.adminKey)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Ghost Admin API key должен быть в формате id:secret."
    );
  }

  const { response, body } = await ghostFetch<GhostSiteResponse>(
    adminUrl,
    input.adminKey,
    `/ghost/api/admin/site/`
  );
  const ok = response.ok;
  return {
    ok,
    statusCode: response.status,
    adminUrl,
    siteTitle: typeof body?.site?.title === "string" ? body.site.title : null,
    error: ok ? null : `Ghost returned HTTP ${response.status}.`,
  };
}

function safeSlug(value: string | null | undefined, fallback: string): string {
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

async function createGhostPost(input: {
  config: GhostPublishingConfig;
  adminKey: string;
  title: string;
  slug: string;
  html: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
  publishLive: boolean;
}): Promise<{ id: string; url: string | null; slug: string | null }> {
  const { response, body } = await ghostFetch<GhostPostResponse>(
    input.config.adminUrl,
    input.adminKey,
    `/ghost/api/admin/posts/?source=html`,
    {
      method: "POST",
      body: JSON.stringify({
        posts: [
          {
            title: input.title,
            slug: input.slug,
            html: input.html,
            status: input.publishLive ? "published" : "draft",
            custom_excerpt: input.excerpt ?? "",
            meta_title: input.metaTitle ?? input.title,
            meta_description: input.metaDescription ?? "",
            tags: input.tags.map((name) => ({ name })),
          },
        ],
      }),
    }
  );
  const post = body?.posts?.[0];
  if (!response.ok || !post?.id) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      `Ghost не создал post (HTTP ${response.status}).`
    );
  }
  return { id: post.id, url: post.url ?? null, slug: post.slug ?? null };
}

export async function createGhostPostForArticle(input: {
  articleId: string;
  websiteId: string;
  organizationId: string;
  userId: string;
  dryRun?: boolean;
  publishLive?: boolean;
}): Promise<GhostPublishResult> {
  const prisma = getPrisma();
  const [article, website, config, adminKey] = await Promise.all([
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
    getGhostPublishingConfig(input.websiteId),
    getGhostAdminKey(input.websiteId),
  ]);

  if (!article || !website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья или сайт не найдены.");
  }
  if (!config?.connected || !adminKey) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Ghost не подключён.");
  }
  if (
    article.qualityPassed !== true ||
    !evaluateCurrentArticlePublishQuality(article).passed
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Ghost публикация доступна только после quality gate."
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
  const slug = safeSlug(article.slug, pkg.slug || article.title);
  const tags = ["RankBoost"].concat(
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
    provider: IntegrationExecutionProvider.GHOST,
    mode: input.publishLive
      ? IntegrationExecutionMode.AUTO_PUBLISH
      : IntegrationExecutionMode.REVIEW_ONLY,
    capability: IntegrationCapability.CMS_ARTICLE_CREATE,
    idempotencyKey: `ghost:post:article:${article.id}`,
    requestPreview: {
      provider: "GHOST",
      adminUrl: config.adminUrl,
      slug,
      title: article.title,
      publishLive: input.publishLive === true,
      contentLength: pkg.html.length,
    },
  });

  if (job.status === IntegrationExecutionStatus.SUCCEEDED) {
    return {
      dryRun: false,
      created: false,
      postId: job.externalId,
      postUrl: job.externalUrl,
      jobId: job.id,
    };
  }

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: "Ghost post creation queued.",
  });

  if (input.dryRun) {
    return {
      dryRun: true,
      created: false,
      postId: null,
      postUrl: null,
      jobId: job.id,
    };
  }

  await markExecutionJobRunning(job.id);
  try {
    const created = await createGhostPost({
      config,
      adminKey,
      title: article.title,
      slug,
      html: pkg.html,
      excerpt: article.metaDescription,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      tags,
      publishLive: input.publishLive === true,
    });
    const postUrl =
      created.url ??
      `${config.adminUrl}/ghost/#/editor/post/${encodeURIComponent(created.id)}`;

    await markExecutionJobSucceeded({
      jobId: job.id,
      externalId: created.id,
      externalUrl: postUrl,
      result: {
        adminUrl: config.adminUrl,
        postId: created.id,
        postUrl,
        slug: created.slug,
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
        wordpressPublishedUrl: postUrl,
      },
    });

    return {
      dryRun: false,
      created: true,
      postId: created.id,
      postUrl,
      jobId: job.id,
    };
  } catch (error) {
    const message =
      error instanceof AppError ? error.message : "Ghost post creation failed.";
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: error instanceof AppError ? error.code : "ghost_failed",
      errorMessage: message,
    });
    throw error;
  }
}
