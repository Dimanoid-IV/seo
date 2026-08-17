import "server-only";

import {
  ArticleStatus,
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { evaluateCurrentArticlePublishQuality } from "@/lib/articles/publish-quality";
import { IntegrationCapability } from "@/lib/integrations/adapters/capabilities";
import {
  appendIntegrationExecutionEvent,
  createIntegrationExecutionJob,
  markExecutionJobFailed,
  markExecutionJobRunning,
  markExecutionJobSucceeded,
} from "@/lib/integrations/execution-jobs";
import { loadBrandKitForWebsite } from "@/lib/brand-kit";
import { buildUniversalExport } from "@/lib/publishing/universal-export";
import {
  getWebflowPublishingConfig,
  getWebflowToken,
  type WebflowPublishingConfig,
} from "@/lib/publishing/webflow-config";

const WEBFLOW_API = "https://api.webflow.com/v2";
const TIMEOUT_MS = 15_000;

export type WebflowConnectionTestResult = {
  ok: boolean;
  statusCode: number;
  siteId: string;
  collectionId: string;
  displayName: string | null;
  error: string | null;
};

export type WebflowPublishResult = {
  dryRun: boolean;
  created: boolean;
  itemId: string | null;
  itemUrl: string | null;
  jobId?: string;
};

type WebflowCollectionResponse = {
  id?: string;
  displayName?: string;
  singularName?: string;
  siteId?: string;
};

type WebflowItemResponse = {
  id?: string;
  cmsLocaleId?: string;
  lastPublished?: string | null;
  isDraft?: boolean;
  fieldData?: Record<string, unknown>;
};

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "RankBoost-Webflow/1.0",
  };
}

async function webflowFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<{ response: Response; body: T | null }> {
  const response = await fetch(`${WEBFLOW_API}${path}`, {
    ...init,
    headers: {
      ...headers(token),
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

export async function testWebflowConnection(input: {
  siteId: string;
  collectionId: string;
  token: string;
}): Promise<WebflowConnectionTestResult> {
  const siteId = input.siteId.trim();
  const collectionId = input.collectionId.trim();
  if (!siteId || !collectionId || !input.token.trim()) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Укажите Webflow siteId, collectionId и token."
    );
  }

  const { response, body } = await webflowFetch<WebflowCollectionResponse>(
    `/collections/${encodeURIComponent(collectionId)}`,
    input.token
  );
  const matchesSite = !body?.siteId || body.siteId.trim() === siteId;
  const ok = response.ok && matchesSite;
  return {
    ok,
    statusCode: response.status,
    siteId,
    collectionId,
    displayName:
      typeof body?.displayName === "string"
        ? body.displayName
        : typeof body?.singularName === "string"
          ? body.singularName
          : null,
    error: ok
      ? null
      : response.ok
        ? "Collection does not belong to the selected site."
        : `Webflow returned HTTP ${response.status}.`,
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

function mapArticleToFieldData(input: {
  config: WebflowPublishingConfig;
  title: string;
  slug: string;
  html: string;
  metaTitle: string | null;
  metaDescription: string | null;
}): Record<string, unknown> {
  const mapping = input.config.fieldMapping;
  const fieldData: Record<string, unknown> = {
    [mapping.name]: input.title,
    [mapping.slug]: input.slug,
    [mapping.body]: input.html,
  };
  if (mapping.summary) {
    fieldData[mapping.summary] = input.metaDescription ?? "";
  }
  if (mapping.metaTitle) {
    fieldData[mapping.metaTitle] = input.metaTitle ?? input.title;
  }
  if (mapping.metaDescription) {
    fieldData[mapping.metaDescription] = input.metaDescription ?? "";
  }
  return fieldData;
}

async function createCollectionItem(input: {
  config: WebflowPublishingConfig;
  token: string;
  fieldData: Record<string, unknown>;
  isDraft: boolean;
}): Promise<WebflowItemResponse> {
  const { response, body } = await webflowFetch<WebflowItemResponse>(
    `/collections/${encodeURIComponent(input.config.collectionId)}/items`,
    input.token,
    {
      method: "POST",
      body: JSON.stringify({
        isArchived: false,
        isDraft: input.isDraft,
        fieldData: input.fieldData,
      }),
    }
  );

  if (!response.ok || !body?.id) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      `Webflow не создал CMS item (HTTP ${response.status}).`
    );
  }
  return body;
}

export async function createWebflowItemForArticle(input: {
  articleId: string;
  websiteId: string;
  organizationId: string;
  userId: string;
  dryRun?: boolean;
  publishLive?: boolean;
}): Promise<WebflowPublishResult> {
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
    getWebflowPublishingConfig(input.websiteId),
    getWebflowToken(input.websiteId),
  ]);

  if (!article || !website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья или сайт не найдены.");
  }
  if (!config?.connected || !token) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Webflow не подключён.");
  }
  if (
    article.qualityPassed !== true ||
    !evaluateCurrentArticlePublishQuality(article).passed
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Webflow публикация доступна только после quality gate."
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
  const fieldData = mapArticleToFieldData({
    config,
    title: article.title,
    slug,
    html: pkg.html,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
  });

  const { job } = await createIntegrationExecutionJob({
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    requestedByUserId: input.userId,
    approvedByUserId: input.userId,
    sourceType: IntegrationExecutionSourceType.ARTICLE,
    sourceId: article.id,
    action: IntegrationExecutionAction.PUBLISH,
    provider: IntegrationExecutionProvider.WEBFLOW,
    mode: IntegrationExecutionMode.REVIEW_ONLY,
    capability: IntegrationCapability.CMS_ARTICLE_CREATE,
    idempotencyKey: `webflow:item:article:${article.id}`,
    requestPreview: {
      provider: "WEBFLOW",
      siteId: config.siteId,
      collectionId: config.collectionId,
      slug,
      title: article.title,
      fieldKeys: Object.keys(fieldData),
      contentLength: pkg.html.length,
    },
  });

  if (job.status === IntegrationExecutionStatus.SUCCEEDED) {
    return {
      dryRun: false,
      created: false,
      itemId: job.externalId,
      itemUrl: job.externalUrl,
      jobId: job.id,
    };
  }

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: "Webflow CMS item creation queued.",
  });

  if (input.dryRun) {
    return {
      dryRun: true,
      created: false,
      itemId: null,
      itemUrl: null,
      jobId: job.id,
    };
  }

  await markExecutionJobRunning(job.id);
  try {
    const item = await createCollectionItem({
      config,
      token,
      fieldData,
      isDraft: input.publishLive !== true,
    });
    const itemUrl = `https://webflow.com/dashboard/sites/${encodeURIComponent(
      config.siteId
    )}/cms/collections/${encodeURIComponent(config.collectionId)}/items/${encodeURIComponent(
      item.id ?? ""
    )}`;

    await markExecutionJobSucceeded({
      jobId: job.id,
      externalId: item.id ?? null,
      externalUrl: itemUrl,
      result: {
        siteId: config.siteId,
        collectionId: config.collectionId,
        itemId: item.id,
        itemUrl,
        isDraft: item.isDraft ?? input.publishLive !== true,
      },
    });

    await prisma.article.update({
      where: { id: article.id },
      data: {
        status:
          article.status === ArticleStatus.PUBLISHED
            ? ArticleStatus.PUBLISHED
            : ArticleStatus.WAITING_REVIEW,
        wordpressPublishedUrl: itemUrl,
      },
    });

    return {
      dryRun: false,
      created: true,
      itemId: item.id ?? null,
      itemUrl,
      jobId: job.id,
    };
  } catch (error) {
    const message =
      error instanceof AppError ? error.message : "Webflow item creation failed.";
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: error instanceof AppError ? error.code : "webflow_failed",
      errorMessage: message,
    });
    throw error;
  }
}
