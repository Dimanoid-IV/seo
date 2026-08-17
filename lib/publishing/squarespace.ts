import "server-only";

import {
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
  markExecutionJobSucceeded,
} from "@/lib/integrations/execution-jobs";
import { buildUniversalExport } from "@/lib/publishing/universal-export";
import {
  getSquarespacePublishingConfig,
  normalizeSquarespaceUrl,
  type SquarespacePublishingConfig,
} from "@/lib/publishing/squarespace-config";

const TIMEOUT_MS = 15_000;

export type SquarespaceConnectionTestResult = {
  ok: boolean;
  statusCode: number;
  siteUrl: string;
  blogUrl: string | null;
  error: string | null;
};

export type SquarespacePackageResult = {
  dryRun: boolean;
  prepared: boolean;
  packageUrl: string | null;
  jobId?: string;
};

async function probePublicUrl(value: string): Promise<number> {
  const url = new URL(normalizeSquarespaceUrl(value));
  await assertSafeUrl(url);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "RankBoost-Squarespace/1.0",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "manual",
  });
  return response.status;
}

export async function testSquarespaceConnection(input: {
  siteUrl: string;
  blogUrl?: string | null;
}): Promise<SquarespaceConnectionTestResult> {
  const siteUrl = normalizeSquarespaceUrl(input.siteUrl);
  const blogUrl = input.blogUrl?.trim()
    ? normalizeSquarespaceUrl(input.blogUrl)
    : null;
  const siteStatus = await probePublicUrl(siteUrl);
  const blogStatus = blogUrl ? await probePublicUrl(blogUrl) : null;
  const ok =
    siteStatus >= 200 &&
    siteStatus < 400 &&
    (blogStatus === null || (blogStatus >= 200 && blogStatus < 400));

  return {
    ok,
    statusCode: blogStatus ?? siteStatus,
    siteUrl,
    blogUrl,
    error: ok ? null : `Squarespace site returned HTTP ${blogStatus ?? siteStatus}.`,
  };
}

function buildPackageUrl(articleId: string): string {
  return `/api/articles/${encodeURIComponent(articleId)}/export`;
}

export async function prepareSquarespacePackageForArticle(input: {
  articleId: string;
  websiteId: string;
  organizationId: string;
  userId: string;
  dryRun?: boolean;
}): Promise<SquarespacePackageResult> {
  const prisma = getPrisma();
  const [article, website, config] = await Promise.all([
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
    getSquarespacePublishingConfig(input.websiteId),
  ]);

  if (!article || !website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья или сайт не найдены.");
  }
  if (!config?.connected) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Squarespace не подключён.");
  }
  if (
    article.qualityPassed !== true ||
    !evaluateCurrentArticlePublishQuality(article).passed
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Squarespace пакет доступен только после quality gate."
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
  const packageUrl = buildPackageUrl(article.id);

  const { job } = await createIntegrationExecutionJob({
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    requestedByUserId: input.userId,
    approvedByUserId: input.userId,
    sourceType: IntegrationExecutionSourceType.ARTICLE,
    sourceId: article.id,
    action: IntegrationExecutionAction.PREPARE_PACKAGE,
    provider: IntegrationExecutionProvider.SQUARESPACE,
    mode: IntegrationExecutionMode.REVIEW_ONLY,
    capability: IntegrationCapability.PREPARE_UNIVERSAL_PACKAGE,
    idempotencyKey: `squarespace:package:article:${article.id}`,
    requestPreview: {
      provider: "SQUARESPACE",
      siteUrl: config.siteUrl,
      blogUrl: config.blogUrl,
      title: article.title,
      slug: pkg.slug,
      contentLength: pkg.html.length,
    },
  });

  if (job.status === IntegrationExecutionStatus.SUCCEEDED) {
    return {
      dryRun: false,
      prepared: false,
      packageUrl: job.externalUrl ?? packageUrl,
      jobId: job.id,
    };
  }

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: "Squarespace package preparation queued.",
  });

  if (input.dryRun) {
    return {
      dryRun: true,
      prepared: false,
      packageUrl,
      jobId: job.id,
    };
  }

  await markExecutionJobSucceeded({
    jobId: job.id,
    externalId: article.id,
    externalUrl: packageUrl,
    result: {
      provider: "SQUARESPACE",
      siteUrl: config.siteUrl,
      blogUrl: config.blogUrl,
      packageUrl,
      title: article.title,
      slug: pkg.slug,
      formats: ["html", "markdown", "meta", "email"],
      publishMode: "guided_manual",
    },
  });

  return {
    dryRun: false,
    prepared: true,
    packageUrl,
    jobId: job.id,
  };
}

export function buildSquarespaceDisplay(config: SquarespacePublishingConfig | null) {
  return {
    connected: config?.connected === true,
    siteUrl: config?.siteUrl ?? null,
    blogUrl: config?.blogUrl ?? null,
  };
}
