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
  getWixApiKey,
  getWixPublishingConfig,
  isSafeWixSiteId,
  type WixPublishingConfig,
} from "@/lib/publishing/wix-config";

const WIX_API = "https://www.wixapis.com";
const TIMEOUT_MS = 15_000;

export type WixConnectionTestResult = {
  ok: boolean;
  statusCode: number;
  siteId: string;
  error: string | null;
};

export type WixPublishResult = {
  dryRun: boolean;
  created: boolean;
  draftPostId: string | null;
  draftPostUrl: string | null;
  jobId?: string;
};

type WixDraftPostResponse = {
  draftPost?: {
    id?: string;
    slug?: string;
    url?: string;
  };
};

type RichTextNode = {
  type: "PARAGRAPH" | "HEADING" | "TEXT";
  id?: string;
  nodes?: RichTextNode[];
  textData?: { text: string };
  headingData?: { level: number };
};

function wixHeaders(input: { apiKey: string; siteId: string }): Record<string, string> {
  return {
    Authorization: `Bearer ${input.apiKey}`,
    "wix-site-id": input.siteId,
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "RankBoost-Wix/1.0",
  };
}

async function wixFetch<T>(
  input: { apiKey: string; siteId: string; path: string; init?: RequestInit }
): Promise<{ response: Response; body: T | null }> {
  const response = await fetch(`${WIX_API}${input.path}`, {
    ...(input.init ?? {}),
    headers: {
      ...wixHeaders({ apiKey: input.apiKey, siteId: input.siteId }),
      ...(input.init?.headers ?? {}),
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

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function textNode(text: string): RichTextNode {
  return {
    type: "TEXT",
    id: crypto.randomUUID(),
    textData: { text },
  };
}

function paragraph(text: string): RichTextNode {
  return {
    type: "PARAGRAPH",
    id: crypto.randomUUID(),
    nodes: [textNode(text)],
  };
}

function buildWixRichContent(html: string): { version: number; nodes: RichTextNode[] } {
  const blocks = html
    .replace(/<\/(p|h2|h3|li)>/gi, "\n")
    .split(/\n+/)
    .map((part) => stripHtml(part))
    .filter(Boolean)
    .slice(0, 80);
  const nodes = (blocks.length > 0 ? blocks : [stripHtml(html)])
    .filter(Boolean)
    .map(paragraph);
  return { version: 1, nodes };
}

export async function testWixConnection(input: {
  siteId: string;
  apiKey: string;
}): Promise<WixConnectionTestResult> {
  const siteId = input.siteId.trim();
  if (!isSafeWixSiteId(siteId) || !input.apiKey.trim()) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Укажите Wix Site ID и API key."
    );
  }

  const { response } = await wixFetch<unknown>({
    apiKey: input.apiKey,
    siteId,
    path: "/blog/v3/draft-posts?paging.limit=1",
    init: { method: "GET" },
  });

  return {
    ok: response.ok,
    statusCode: response.status,
    siteId,
    error: response.ok ? null : `Wix returned HTTP ${response.status}.`,
  };
}

async function createWixDraftPost(input: {
  config: WixPublishingConfig;
  apiKey: string;
  title: string;
  slug: string;
  html: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}): Promise<{ id: string; url: string | null; slug: string | null }> {
  const { response, body } = await wixFetch<WixDraftPostResponse>({
    apiKey: input.apiKey,
    siteId: input.config.siteId,
    path: "/blog/v3/draft-posts",
    init: {
      method: "POST",
      body: JSON.stringify({
        draftPost: {
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt ?? "",
          richContent: buildWixRichContent(input.html),
          seoData: {
            tags: [
              { type: "title", children: input.metaTitle ?? input.title },
              {
                type: "meta",
                props: {
                  name: "description",
                  content: input.metaDescription ?? input.excerpt ?? "",
                },
              },
            ],
          },
        },
      }),
    },
  });
  const draftPost = body?.draftPost;
  if (!response.ok || !draftPost?.id) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      `Wix не создал draft post (HTTP ${response.status}).`
    );
  }
  return {
    id: draftPost.id,
    url: draftPost.url ?? null,
    slug: draftPost.slug ?? null,
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

export async function createWixDraftPostForArticle(input: {
  articleId: string;
  websiteId: string;
  organizationId: string;
  userId: string;
  dryRun?: boolean;
}): Promise<WixPublishResult> {
  const prisma = getPrisma();
  const [article, website, config, apiKey] = await Promise.all([
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
    getWixPublishingConfig(input.websiteId),
    getWixApiKey(input.websiteId),
  ]);

  if (!article || !website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья или сайт не найдены.");
  }
  if (!config?.connected || !apiKey) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Wix не подключён.");
  }
  if (article.qualityPassed !== true) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Wix публикация доступна только после quality gate."
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

  const { job } = await createIntegrationExecutionJob({
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    requestedByUserId: input.userId,
    approvedByUserId: input.userId,
    sourceType: IntegrationExecutionSourceType.ARTICLE,
    sourceId: article.id,
    action: IntegrationExecutionAction.CREATE_DRAFT,
    provider: IntegrationExecutionProvider.WIX,
    mode: IntegrationExecutionMode.REVIEW_ONLY,
    capability: IntegrationCapability.CMS_ARTICLE_CREATE,
    idempotencyKey: `wix:draft-post:article:${article.id}`,
    requestPreview: {
      provider: "WIX",
      siteId: config.siteId,
      slug,
      title: article.title,
      contentLength: pkg.html.length,
    },
  });

  if (job.status === IntegrationExecutionStatus.SUCCEEDED) {
    return {
      dryRun: false,
      created: false,
      draftPostId: job.externalId,
      draftPostUrl: job.externalUrl,
      jobId: job.id,
    };
  }

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: "Wix draft post creation queued.",
  });

  if (input.dryRun) {
    return {
      dryRun: true,
      created: false,
      draftPostId: null,
      draftPostUrl: null,
      jobId: job.id,
    };
  }

  await markExecutionJobRunning(job.id);
  try {
    const created = await createWixDraftPost({
      config,
      apiKey,
      title: article.title,
      slug,
      html: pkg.html,
      excerpt: article.metaDescription,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
    });
    const draftPostUrl =
      created.url ??
      `https://manage.wix.com/dashboard/${encodeURIComponent(
        config.siteId
      )}/blog/post/${encodeURIComponent(created.id)}`;

    await markExecutionJobSucceeded({
      jobId: job.id,
      externalId: created.id,
      externalUrl: draftPostUrl,
      result: {
        siteId: config.siteId,
        draftPostId: created.id,
        draftPostUrl,
        slug: created.slug,
        published: false,
      },
    });

    await prisma.article.update({
      where: { id: article.id },
      data: {
        status:
          article.status === ArticleStatus.PUBLISHED
            ? ArticleStatus.PUBLISHED
            : ArticleStatus.WAITING_REVIEW,
        wordpressPublishedUrl: draftPostUrl,
      },
    });

    return {
      dryRun: false,
      created: true,
      draftPostId: created.id,
      draftPostUrl,
      jobId: job.id,
    };
  } catch (error) {
    const message =
      error instanceof AppError ? error.message : "Wix draft post creation failed.";
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: error instanceof AppError ? error.code : "wix_failed",
      errorMessage: message,
    });
    throw error;
  }
}
