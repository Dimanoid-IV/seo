/**
 * WordPress REST create/update publisher.
 */
import "server-only";

import { assertSafeWordPressUrl, buildWpRestBase } from "../../wordpress/normalize-url";
import type { WordPressRestCredentials } from "../../wordpress/rest-client";
import { AppError, ErrorCode } from "@/lib/errors";
import { safeLogError } from "@/lib/logging";

const TIMEOUT_MS = 15_000;

export type WordPressPublishInput = {
  title: string;
  contentHtml: string;
  excerpt?: string;
  slug?: string | null;
  categories?: number[];
  tags?: number[];
  featuredMediaId?: number | null;
  author?: number | null;
  scheduledAt?: Date | string | null;
  existingPostId?: string | null;
  objectType?: "posts" | "pages";
};

export type WordPressPublishResult = {
  postId: string;
  editUrl: string;
  link: string | null;
  /** Actual WP status returned (publish | draft | pending | …). */
  status: string;
  /** True only when WP confirmed status === "publish". */
  livePublished: boolean;
  operation: "created" | "updated";
};

export type WordPressPublishVerificationResult = {
  verified: boolean;
  statusCode?: number;
  checks: {
    hasPublicUrl: boolean;
    statusOk: boolean;
    titleFound: boolean;
    contentSignalFound: boolean;
  };
  errorCode?: string;
};

function basicAuthHeader(username: string, applicationPassword: string): string {
  const password = applicationPassword.replace(/\s+/g, "");
  const token = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function safeWpErrorMessage(status: number): string {
  if (status === 401) {
    return "WordPress отклонил логин или Application Password. Проверьте данные.";
  }
  if (status === 403) {
    return "У пользователя нет прав на публикацию записей в WordPress.";
  }
  if (status === 404) {
    return "REST API WordPress не найден. Убедитесь, что постоянные ссылки включены.";
  }
  return `WordPress вернул ошибку (HTTP ${status}).`;
}

export function mapArticleToWpRestPublishPayload(
  input: WordPressPublishInput
): Record<string, unknown> {
  const scheduledAt = input.scheduledAt
    ? new Date(input.scheduledAt)
    : null;
  const isFuture = Boolean(
    scheduledAt &&
      Number.isFinite(scheduledAt.getTime()) &&
      scheduledAt.getTime() > Date.now()
  );
  return {
    title: input.title,
    content: input.contentHtml,
    status: isFuture ? "future" : "publish",
    excerpt: input.excerpt ?? "",
    ...(input.slug ? { slug: input.slug } : {}),
    ...(input.categories?.length ? { categories: input.categories } : {}),
    ...(input.tags?.length ? { tags: input.tags } : {}),
    ...(input.featuredMediaId && input.featuredMediaId > 0
      ? { featured_media: input.featuredMediaId }
      : {}),
    ...(input.author && input.author > 0 ? { author: input.author } : {}),
    ...(isFuture && scheduledAt ? { date: scheduledAt.toISOString() } : {}),
  };
}

/**
 * Create a new WordPress post with status publish.
 * Does not PATCH/update existing posts.
 */
export async function createWordPressRestPublishedPost(
  credentials: WordPressRestCredentials,
  article: WordPressPublishInput
): Promise<WordPressPublishResult> {
  return upsertWordPressRestPost(credentials, article);
}

/** Create or update a WordPress post/page with publish or future status. */
export async function upsertWordPressRestPost(
  credentials: WordPressRestCredentials,
  article: WordPressPublishInput
): Promise<WordPressPublishResult> {
  const { normalized } = await assertSafeWordPressUrl(credentials.siteUrl);
  const base = buildWpRestBase(normalized);
  const payload = mapArticleToWpRestPublishPayload(article);
  const objectType = article.objectType ?? "posts";
  const endpoint = article.existingPostId
    ? `${base}/${objectType}/${encodeURIComponent(article.existingPostId)}`
    : `${base}/${objectType}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(
          credentials.username,
          credentials.applicationPassword
        ),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
    });
  } catch (error) {
    safeLogError("wordpress.rest.publish", error, {});
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось опубликовать запись в WordPress."
    );
  }

  let body: {
    id?: number;
    link?: string;
    status?: string;
  } = {};
  try {
    body = (await response.json()) as typeof body;
  } catch {
    body = {};
  }

  if (!response.ok || typeof body.id !== "number") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      safeWpErrorMessage(response.status)
    );
  }

  const status =
    typeof body.status === "string" && body.status.trim()
      ? body.status.trim().toLowerCase()
      : "unknown";
  const postId = String(body.id);
  const editUrl = `${normalized}/wp-admin/post.php?post=${postId}&action=edit`;
  const livePublished = status === "publish";

  return {
    postId,
    editUrl,
    link: typeof body.link === "string" ? body.link : null,
    status,
    livePublished,
    operation: article.existingPostId ? "updated" : "created",
  };
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contentSignalWordsFromHtml(contentHtml: string): string[] {
  const normalized = normalizeText(contentHtml);
  if (!normalized) return [];
  return [...new Set(normalized.split(" ").filter((word) => word.length > 3))]
    .slice(0, 12);
}

/**
 * Verify that a live WordPress publish is publicly reachable and contains
 * article-specific content. API success alone is not enough for SUCCESS.
 */
export async function verifyWordPressPublishedPost(input: {
  publicUrl: string | null;
  expectedTitle: string;
  expectedContentHtml: string;
}): Promise<WordPressPublishVerificationResult> {
  const checks = {
    hasPublicUrl: Boolean(input.publicUrl),
    statusOk: false,
    titleFound: false,
    contentSignalFound: false,
  };

  if (!input.publicUrl) {
    return { verified: false, checks, errorCode: "missing_public_url" };
  }

  let response: Response;
  try {
    response = await fetch(input.publicUrl, {
      method: "GET",
      headers: { Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });
  } catch (error) {
    safeLogError("wordpress.rest.verify_publish", error, {});
    return { verified: false, checks, errorCode: "verification_fetch_failed" };
  }

  checks.statusOk = response.status >= 200 && response.status < 300;
  const statusCode = response.status;
  if (!checks.statusOk) {
    return { verified: false, statusCode, checks, errorCode: "public_url_not_ok" };
  }

  let body = "";
  try {
    body = await response.text();
  } catch {
    body = "";
  }

  const normalizedBody = normalizeText(body);
  const normalizedTitle = normalizeText(input.expectedTitle);
  const signalWords = contentSignalWordsFromHtml(input.expectedContentHtml);
  const matchedSignalWords = signalWords.filter((word) =>
    normalizedBody.includes(word)
  );

  checks.titleFound =
    normalizedTitle.length > 0 && normalizedBody.includes(normalizedTitle);
  checks.contentSignalFound = Boolean(
    signalWords.length > 0 &&
      matchedSignalWords.length >= Math.min(5, signalWords.length)
  );

  return {
    verified: checks.statusOk && checks.titleFound && checks.contentSignalFound,
    statusCode,
    checks,
    errorCode:
      checks.titleFound && checks.contentSignalFound
        ? undefined
        : "published_content_not_verified",
  };
}
