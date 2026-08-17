/**
 * GitHub PR publisher for custom/static sites.
 * Creates a branch, writes one Markdown file, and opens a pull request.
 */
import "server-only";

import { ArticleStatus, IntegrationExecutionStatus } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { evaluateCurrentArticlePublishQuality } from "@/lib/articles/publish-quality";
import { buildUniversalExport } from "@/lib/publishing/universal-export";
import { loadBrandKitForWebsite } from "@/lib/brand-kit";
import {
  getGitHubPrConfig,
  getGitHubPrToken,
  type GitHubPrConfig,
} from "@/lib/publishing/github-pr-config";
import {
  appendIntegrationExecutionEvent,
  createIntegrationExecutionJob,
  markExecutionJobFailed,
  markExecutionJobRunning,
  markExecutionJobSucceeded,
} from "@/lib/integrations/execution-jobs";
import {
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
} from "@prisma/client";
import { IntegrationCapability } from "@/lib/integrations/adapters/capabilities";

const GITHUB_API = "https://api.github.com";
const TIMEOUT_MS = 15_000;

type GitHubJson = Record<string, unknown>;

export type GitHubConnectionTestResult = {
  ok: boolean;
  statusCode: number;
  owner: string;
  repo: string;
  baseBranch: string;
  defaultBranch: string | null;
  permissions: {
    push: boolean;
    maintain: boolean;
    admin: boolean;
  };
  error: string | null;
};

export type GitHubPrPublishResult = {
  dryRun: boolean;
  created: boolean;
  pullRequestUrl: string | null;
  branchName: string;
  filePath: string;
  jobId?: string;
};

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "RankBoost-GitHubPR/1.0",
  };
}

async function githubFetchJson<T = GitHubJson>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<{ response: Response; body: T | null }> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      ...githubHeaders(token),
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

function encodePathSegment(value: string): string {
  return encodeURIComponent(value).replace(/%2F/g, "/");
}

function buildMarkdownWithFrontmatter(input: {
  title: string;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  targetKeyword: string | null;
  contentMarkdown: string;
}): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(input.title)}`,
    `slug: ${JSON.stringify(input.slug)}`,
  ];
  if (input.metaTitle) lines.push(`metaTitle: ${JSON.stringify(input.metaTitle)}`);
  if (input.metaDescription) {
    lines.push(`metaDescription: ${JSON.stringify(input.metaDescription)}`);
  }
  if (input.targetKeyword) {
    lines.push(`targetKeyword: ${JSON.stringify(input.targetKeyword)}`);
  }
  lines.push("source: rankboost", "---", "", input.contentMarkdown.trim(), "");
  return lines.join("\n");
}

function sanitizeSlug(value: string | null | undefined, fallback: string): string {
  const raw = (value ?? fallback).toLowerCase();
  return raw
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90) || "rankboost-article";
}

export async function testGitHubPrConnection(input: {
  owner: string;
  repo: string;
  baseBranch?: string | null;
  token: string;
}): Promise<GitHubConnectionTestResult> {
  const owner = input.owner.trim();
  const repo = input.repo.trim();
  const baseBranch = input.baseBranch?.trim() || "main";
  if (!owner || !repo || !input.token.trim()) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Укажите owner, repo и GitHub token."
    );
  }

  const { response, body } = await githubFetchJson<{
    default_branch?: string;
    permissions?: { push?: boolean; maintain?: boolean; admin?: boolean };
  }>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, input.token);

  const permissions = {
    push: body?.permissions?.push === true,
    maintain: body?.permissions?.maintain === true,
    admin: body?.permissions?.admin === true,
  };
  const ok = response.ok && (permissions.push || permissions.maintain || permissions.admin);
  return {
    ok,
    statusCode: response.status,
    owner,
    repo,
    baseBranch,
    defaultBranch:
      typeof body?.default_branch === "string" ? body.default_branch : null,
    permissions,
    error: ok
      ? null
      : response.ok
        ? "Token does not have push access to this repository."
        : `GitHub returned HTTP ${response.status}.`,
  };
}

async function getBranchSha(config: GitHubPrConfig, token: string): Promise<string> {
  const { response, body } = await githubFetchJson<{ object?: { sha?: string } }>(
    `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/git/ref/heads/${encodeURIComponent(config.baseBranch)}`,
    token
  );
  if (!response.ok || typeof body?.object?.sha !== "string") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Не удалось найти base branch в GitHub repository."
    );
  }
  return body.object.sha;
}

async function createBranch(input: {
  config: GitHubPrConfig;
  token: string;
  branchName: string;
  sha: string;
}): Promise<void> {
  const { response } = await githubFetchJson(
    `/repos/${encodeURIComponent(input.config.owner)}/${encodeURIComponent(input.config.repo)}/git/refs`,
    input.token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: `refs/heads/${input.branchName}`,
        sha: input.sha,
      }),
    }
  );
  // 422 often means branch already exists; idempotent PR creation can continue.
  if (!response.ok && response.status !== 422) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      `GitHub не создал branch (HTTP ${response.status}).`
    );
  }
}

async function putFile(input: {
  config: GitHubPrConfig;
  token: string;
  branchName: string;
  filePath: string;
  content: string;
  message: string;
}): Promise<void> {
  const { response } = await githubFetchJson(
    `/repos/${encodeURIComponent(input.config.owner)}/${encodeURIComponent(input.config.repo)}/contents/${encodePathSegment(input.filePath)}`,
    input.token,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input.message,
        content: Buffer.from(input.content, "utf8").toString("base64"),
        branch: input.branchName,
      }),
    }
  );
  if (!response.ok) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      `GitHub не сохранил файл (HTTP ${response.status}).`
    );
  }
}

async function openPullRequest(input: {
  config: GitHubPrConfig;
  token: string;
  branchName: string;
  title: string;
  body: string;
}): Promise<string | null> {
  const { response, body } = await githubFetchJson<{ html_url?: string }>(
    `/repos/${encodeURIComponent(input.config.owner)}/${encodeURIComponent(input.config.repo)}/pulls`,
    input.token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        head: input.branchName,
        base: input.config.baseBranch,
        body: input.body,
      }),
    }
  );
  if (!response.ok && response.status !== 422) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      `GitHub не создал pull request (HTTP ${response.status}).`
    );
  }
  return typeof body?.html_url === "string" ? body.html_url : null;
}

export async function createGitHubPrForArticle(input: {
  articleId: string;
  websiteId: string;
  organizationId: string;
  userId: string;
  dryRun?: boolean;
}): Promise<GitHubPrPublishResult> {
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
    getGitHubPrConfig(input.websiteId),
    getGitHubPrToken(input.websiteId),
  ]);

  if (!article || !website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья или сайт не найдены.");
  }
  if (!config?.connected || !token) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "GitHub PR не подключён.");
  }
  if (
    article.qualityPassed !== true ||
    !evaluateCurrentArticlePublishQuality(article).passed
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "GitHub PR доступен только для статьи, прошедшей quality gate."
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
  const slug = sanitizeSlug(article.slug, pkg.slug || article.title);
  const filePath = `${config.contentPath}/${slug}.md`;
  const branchName = `rankboost/article-${article.id.slice(0, 8)}-${Date.now()}`;

  const { job } = await createIntegrationExecutionJob({
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    requestedByUserId: input.userId,
    approvedByUserId: input.userId,
    sourceType: IntegrationExecutionSourceType.ARTICLE,
    sourceId: article.id,
    action: IntegrationExecutionAction.PUBLISH,
    provider: IntegrationExecutionProvider.GITHUB,
    mode: IntegrationExecutionMode.REVIEW_ONLY,
    capability: IntegrationCapability.GITHUB_CREATE_PULL_REQUEST,
    idempotencyKey: `github:pr:article:${article.id}`,
    requestPreview: {
      provider: "GITHUB",
      owner: config.owner,
      repo: config.repo,
      baseBranch: config.baseBranch,
      filePath,
      title: article.title,
      contentLength: pkg.markdown.length,
    },
  });

  if (job.status === IntegrationExecutionStatus.SUCCEEDED) {
    return {
      dryRun: false,
      created: false,
      pullRequestUrl: job.externalUrl,
      branchName,
      filePath,
      jobId: job.id,
    };
  }

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: "GitHub PR creation queued.",
  });

  if (input.dryRun) {
    return {
      dryRun: true,
      created: false,
      pullRequestUrl: null,
      branchName,
      filePath,
      jobId: job.id,
    };
  }

  await markExecutionJobRunning(job.id);
  try {
    const baseSha = await getBranchSha(config, token);
    await createBranch({ config, token, branchName, sha: baseSha });
    const content = buildMarkdownWithFrontmatter({
      title: article.title,
      slug,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      targetKeyword: article.targetKeyword,
      contentMarkdown: pkg.markdown,
    });
    await putFile({
      config,
      token,
      branchName,
      filePath,
      content,
      message: `Add RankBoost article: ${article.title}`,
    });
    const pullRequestUrl = await openPullRequest({
      config,
      token,
      branchName,
      title: `Add RankBoost article: ${article.title}`,
      body:
        "Generated by RankBoost after quality review. Please review and merge when ready.",
    });

    await markExecutionJobSucceeded({
      jobId: job.id,
      externalUrl: pullRequestUrl,
      result: {
        owner: config.owner,
        repo: config.repo,
        branchName,
        filePath,
        pullRequestUrl,
      },
    });

    await prisma.article.update({
      where: { id: article.id },
      data: {
        status:
          article.status === ArticleStatus.PUBLISHED
            ? ArticleStatus.PUBLISHED
            : ArticleStatus.WAITING_REVIEW,
        wordpressPublishedUrl: pullRequestUrl ?? undefined,
      },
    });

    return {
      dryRun: false,
      created: true,
      pullRequestUrl,
      branchName,
      filePath,
      jobId: job.id,
    };
  } catch (error) {
    const message =
      error instanceof AppError ? error.message : "GitHub PR creation failed.";
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: error instanceof AppError ? error.code : "github_pr_failed",
      errorMessage: message,
    });
    throw error;
  }
}
