/**
 * WordPress REST metadata update for approved SEO prepared fixes.
 * First supported scope: core title + excerpt on an existing post/page.
 */
import "server-only";

import { assertSafeWordPressUrl, buildWpRestBase } from "../../wordpress/normalize-url";
import type { WordPressRestCredentials } from "../../wordpress/rest-client";
import { AppError, ErrorCode } from "@/lib/errors";
import { safeLogError } from "@/lib/logging";

const TIMEOUT_MS = 15_000;

export type WordPressMetadataUpdateInput = {
  targetUrl: string;
  metaTitle: string;
  metaDescription: string;
  targetQuery?: string | null;
};

export type WordPressMetadataTarget = {
  objectType: "posts" | "pages";
  postId: string;
  link: string | null;
};

export type WordPressMetadataUpdateResult = WordPressMetadataTarget & {
  editUrl: string;
  status: string;
  titleUpdated: boolean;
  excerptUpdated: boolean;
};

export type WordPressMetadataVerificationResult = {
  verified: boolean;
  statusCode?: number;
  checks: {
    hasPublicUrl: boolean;
    statusOk: boolean;
    titleFound: boolean;
    metaDescriptionFound: boolean;
  };
  errorCode?: string;
};

type WpSearchItem = {
  id?: number;
  link?: string;
  status?: string;
};

type WpUpdateBody = WpSearchItem & {
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
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
    return "У пользователя нет прав на изменение этой страницы в WordPress.";
  }
  if (status === 404) {
    return "Страница WordPress для этого URL не найдена.";
  }
  return `WordPress вернул ошибку (HTTP ${status}).`;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlAttributeDecode(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMetaDescription(html: string): string | null {
  const patterns = [
    /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
    /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i,
    /<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
    /<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return htmlAttributeDecode(match[1]);
  }
  return null;
}

function extractSlugFromTargetUrl(targetUrl: string): string | null {
  try {
    const parsed = new URL(targetUrl);
    const segments = parsed.pathname
      .split("/")
      .map((segment) => decodeURIComponent(segment.trim()))
      .filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}

function sameOriginOrThrow(siteUrl: string, targetUrl: string): void {
  let site: URL;
  let target: URL;
  try {
    site = new URL(siteUrl);
    target = new URL(targetUrl);
  } catch {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Некорректный URL страницы для изменения."
    );
  }

  if (site.hostname.toLowerCase() !== target.hostname.toLowerCase()) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "URL страницы не относится к подключённому WordPress-сайту."
    );
  }
}

export function parsePreparedMetadataValue(
  value: string
): WordPressMetadataUpdateInput {
  let data: unknown;
  try {
    data = JSON.parse(value);
  } catch {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Prepared fix не содержит структурированные metadata-данные."
    );
  }

  if (!data || typeof data !== "object") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Prepared fix не содержит metadata-данные."
    );
  }

  const record = data as Record<string, unknown>;
  const targetUrl =
    typeof record.targetUrl === "string" ? record.targetUrl.trim() : "";
  const metaTitle =
    typeof record.metaTitle === "string" ? record.metaTitle.trim() : "";
  const metaDescription =
    typeof record.metaDescription === "string"
      ? record.metaDescription.trim()
      : "";
  const targetQuery =
    typeof record.targetQuery === "string" ? record.targetQuery.trim() : null;

  if (!targetUrl || !metaTitle || !metaDescription) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Prepared fix должен содержать targetUrl, metaTitle и metaDescription."
    );
  }

  return {
    targetUrl,
    metaTitle: metaTitle.slice(0, 90),
    metaDescription: metaDescription.slice(0, 180),
    targetQuery,
  };
}

async function wpFetchJson<T>(
  url: string,
  credentials: WordPressRestCredentials,
  init: RequestInit = {}
): Promise<{ response: Response; body: T | null }> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: basicAuthHeader(
          credentials.username,
          credentials.applicationPassword
        ),
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
    });
  } catch (error) {
    safeLogError("wordpress.rest.metadata_fetch", error, {});
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось связаться с WordPress."
    );
  }

  let body: T | null = null;
  try {
    body = (await response.json()) as T;
  } catch {
    body = null;
  }

  return { response, body };
}

async function searchWordPressObject(input: {
  base: string;
  credentials: WordPressRestCredentials;
  objectType: "posts" | "pages";
  slug: string;
  targetUrl: string;
}): Promise<WordPressMetadataTarget | null> {
  const params = new URLSearchParams({
    slug: input.slug,
    per_page: "5",
    context: "edit",
  });
  const { response, body } = await wpFetchJson<WpSearchItem[]>(
    `${input.base}/${input.objectType}?${params.toString()}`,
    input.credentials
  );

  if (!response.ok || !Array.isArray(body)) return null;

  const targetPath = new URL(input.targetUrl).pathname.replace(/\/$/, "");
  const item =
    body.find((candidate) => {
      if (typeof candidate.id !== "number") return false;
      if (typeof candidate.link !== "string") return true;
      try {
        const linkPath = new URL(candidate.link).pathname.replace(/\/$/, "");
        return linkPath === targetPath || linkPath.endsWith(`/${input.slug}`);
      } catch {
        return true;
      }
    }) ?? null;

  if (!item || typeof item.id !== "number") return null;
  return {
    objectType: input.objectType,
    postId: String(item.id),
    link: typeof item.link === "string" ? item.link : null,
  };
}

export async function findWordPressContentByUrl(
  credentials: WordPressRestCredentials,
  targetUrl: string
): Promise<WordPressMetadataTarget> {
  const { normalized } = await assertSafeWordPressUrl(credentials.siteUrl);
  sameOriginOrThrow(normalized, targetUrl);

  const slug = extractSlugFromTargetUrl(targetUrl);
  if (!slug) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Автоматическое изменение главной страницы пока не поддерживается."
    );
  }

  const base = buildWpRestBase(normalized);
  const post = await searchWordPressObject({
    base,
    credentials,
    objectType: "posts",
    slug,
    targetUrl,
  });
  if (post) return post;

  const page = await searchWordPressObject({
    base,
    credentials,
    objectType: "pages",
    slug,
    targetUrl,
  });
  if (page) return page;

  throw new AppError(
    ErrorCode.NOT_FOUND,
    "Не удалось найти запись или страницу WordPress по этому URL."
  );
}

export function mapMetadataUpdateToWpRestPayload(
  input: WordPressMetadataUpdateInput
): Record<string, unknown> {
  return {
    title: input.metaTitle,
    excerpt: input.metaDescription,
  };
}

export async function updateWordPressCoreMetadata(
  credentials: WordPressRestCredentials,
  input: WordPressMetadataUpdateInput
): Promise<WordPressMetadataUpdateResult> {
  const { normalized } = await assertSafeWordPressUrl(credentials.siteUrl);
  sameOriginOrThrow(normalized, input.targetUrl);
  const base = buildWpRestBase(normalized);
  const target = await findWordPressContentByUrl(credentials, input.targetUrl);
  const payload = mapMetadataUpdateToWpRestPayload(input);

  const { response, body } = await wpFetchJson<WpUpdateBody>(
    `${base}/${target.objectType}/${target.postId}`,
    credentials,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok || !body || typeof body.id !== "number") {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      safeWpErrorMessage(response.status)
    );
  }

  const renderedTitle =
    typeof body.title?.rendered === "string" ? body.title.rendered : "";
  const renderedExcerpt =
    typeof body.excerpt?.rendered === "string" ? body.excerpt.rendered : "";

  return {
    ...target,
    postId: String(body.id),
    link: typeof body.link === "string" ? body.link : target.link,
    editUrl: `${normalized}/wp-admin/post.php?post=${body.id}&action=edit`,
    status:
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim().toLowerCase()
        : "unknown",
    titleUpdated: normalizeText(renderedTitle).includes(
      normalizeText(input.metaTitle)
    ),
    excerptUpdated: normalizeText(renderedExcerpt).includes(
      normalizeText(input.metaDescription)
    ),
  };
}

/**
 * Verify public HTML after metadata update. We require both title and
 * meta-description signals before claiming success and completing the task.
 */
export async function verifyWordPressMetadataUpdate(input: {
  publicUrl: string | null;
  expectedTitle: string;
  expectedMetaDescription: string;
}): Promise<WordPressMetadataVerificationResult> {
  const checks = {
    hasPublicUrl: Boolean(input.publicUrl),
    statusOk: false,
    titleFound: false,
    metaDescriptionFound: false,
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
    safeLogError("wordpress.rest.verify_metadata", error, {});
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
  const description = extractMetaDescription(body);
  const normalizedDescription = description ? normalizeText(description) : "";
  const expectedDescription = normalizeText(input.expectedMetaDescription);

  checks.titleFound =
    normalizedTitle.length > 0 && normalizedBody.includes(normalizedTitle);
  checks.metaDescriptionFound =
    expectedDescription.length > 0 &&
    normalizedDescription.includes(expectedDescription);

  return {
    verified:
      checks.statusOk && checks.titleFound && checks.metaDescriptionFound,
    statusCode,
    checks,
    errorCode:
      checks.titleFound && checks.metaDescriptionFound
        ? undefined
        : "metadata_not_verified_publicly",
  };
}
