/**
 * Native WordPress REST client using Application Passwords (Basic auth).
 * Draft-only — never sets status to publish.
 */
import "server-only";

import { assertSafeWordPressUrl, buildWpRestBase } from "./normalize-url";
import { mapArticleToWpRestDraftPayload } from "./rest-payload";
import { AppError, ErrorCode } from "@/lib/errors";
import { safeLogError } from "@/lib/logging";

const TIMEOUT_MS = 15_000;

export type WordPressRestCredentials = {
  siteUrl: string;
  username: string;
  applicationPassword: string;
};

export type WordPressRestTestResult = {
  ok: true;
  userId: number;
  userLogin: string;
  siteUrl: string;
  httpsWarning: boolean;
};

export type WordPressRestDraftInput = {
  title: string;
  contentHtml: string;
  excerpt?: string;
  slug?: string | null;
  status?: "draft";
  categories?: number[];
  author?: number | null;
};

export type WordPressRestDraftResult = {
  postId: string;
  editUrl: string;
  link: string | null;
};

function basicAuthHeader(username: string, applicationPassword: string): string {
  // Application passwords may include spaces — strip them for Basic auth.
  const password = applicationPassword.replace(/\s+/g, "");
  const token = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function safeWpErrorMessage(status: number): string {
  if (status === 401) {
    return "WordPress отклонил логин или Application Password. Проверьте данные.";
  }
  if (status === 403) {
    return "У пользователя нет прав на создание записей в WordPress.";
  }
  if (status === 404) {
    return "REST API WordPress не найден. Убедитесь, что постоянные ссылки включены.";
  }
  return `WordPress вернул ошибку (HTTP ${status}).`;
}

async function wpFetch(
  url: string,
  init: RequestInit & { username: string; applicationPassword: string }
): Promise<Response> {
  const { username, applicationPassword, ...rest } = init;
  return fetch(url, {
    ...rest,
    headers: {
      ...(rest.headers ?? {}),
      Authorization: basicAuthHeader(username, applicationPassword),
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "manual",
  });
}

/**
 * Probe /wp-json/wp/v2 then authenticate via /users/me.
 */
export async function testWordPressApplicationPassword(
  input: WordPressRestCredentials
): Promise<WordPressRestTestResult> {
  const { normalized, httpsWarning } = await assertSafeWordPressUrl(input.siteUrl);
  const base = buildWpRestBase(normalized);
  const username = input.username.trim();
  const applicationPassword = input.applicationPassword.trim();

  if (!username || !applicationPassword) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Укажите имя пользователя и Application Password."
    );
  }

  // Public REST discovery (no auth) — proves /wp-json/wp/v2 exists.
  try {
    const discovery = await fetch(base, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
    });
    if (discovery.status < 200 || discovery.status >= 400) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Не удалось открыть WordPress REST API. Проверьте URL и постоянные ссылки."
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    safeLogError("wordpress.rest.discovery", error, {});
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось связаться с WordPress."
    );
  }

  let meResponse: Response;
  try {
    meResponse = await wpFetch(`${base}/users/me?context=edit`, {
      method: "GET",
      username,
      applicationPassword,
    });
  } catch (error) {
    safeLogError("wordpress.rest.users_me", error, {});
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось проверить авторизацию WordPress."
    );
  }

  if (!meResponse.ok) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      safeWpErrorMessage(meResponse.status)
    );
  }

  let body: { id?: number; slug?: string; name?: string } = {};
  try {
    body = (await meResponse.json()) as typeof body;
  } catch {
    body = {};
  }

  if (typeof body.id !== "number") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "WordPress вернул неожиданный ответ при проверке пользователя."
    );
  }

  return {
    ok: true,
    userId: body.id,
    userLogin: typeof body.slug === "string" ? body.slug : username,
    siteUrl: normalized,
    httpsWarning,
  };
}

/**
 * Create a DRAFT post via POST /wp-json/wp/v2/posts. Never publishes.
 */
export async function createWordPressRestDraft(
  credentials: WordPressRestCredentials,
  draft: WordPressRestDraftInput
): Promise<WordPressRestDraftResult> {
  const { normalized } = await assertSafeWordPressUrl(credentials.siteUrl);
  const base = buildWpRestBase(normalized);

  const payload = mapArticleToWpRestDraftPayload({
    title: draft.title,
    contentHtml: draft.contentHtml,
    metaDescription: draft.excerpt ?? "",
    slug: draft.slug,
    categories: draft.categories,
    author: draft.author,
  });
  // Guard: status is always draft from mapper; never allow override to publish.
  payload.status = "draft";

  let response: Response;
  try {
    response = await wpFetch(`${base}/posts`, {
      method: "POST",
      username: credentials.username,
      applicationPassword: credentials.applicationPassword,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    safeLogError("wordpress.rest.create_draft", error, {});
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось создать черновик в WordPress."
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

  // Guard: if WP somehow returned a non-draft, treat as failure (never accept live).
  if (body.status && body.status !== "draft" && body.status !== "pending") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "WordPress вернул неожиданный статус записи. Черновик не принят."
    );
  }

  const postId = String(body.id);
  const editUrl = `${normalized}/wp-admin/post.php?post=${postId}&action=edit`;

  return {
    postId,
    editUrl,
    link: typeof body.link === "string" ? body.link : null,
  };
}

export { mapArticleToWpRestDraftPayload };
