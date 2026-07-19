/**
 * WordPress REST live publish — POST /wp-json/wp/v2/posts with status publish.
 * Only for new articles; never updates existing posts/pages.
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
  author?: number | null;
};

export type WordPressPublishResult = {
  postId: string;
  editUrl: string;
  link: string | null;
  /** Actual WP status returned (publish | draft | pending | …). */
  status: string;
  /** True only when WP confirmed status === "publish". */
  livePublished: boolean;
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
  return {
    title: input.title,
    content: input.contentHtml,
    status: "publish",
    excerpt: input.excerpt ?? "",
    ...(input.slug ? { slug: input.slug } : {}),
    ...(input.categories?.length ? { categories: input.categories } : {}),
    ...(input.author && input.author > 0 ? { author: input.author } : {}),
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
  const { normalized } = await assertSafeWordPressUrl(credentials.siteUrl);
  const base = buildWpRestBase(normalized);
  const payload = mapArticleToWpRestPublishPayload(article);
  payload.status = "publish";

  let response: Response;
  try {
    response = await fetch(`${base}/posts`, {
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
  };
}
