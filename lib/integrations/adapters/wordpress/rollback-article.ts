/**
 * WordPress REST rollback — PATCH post status to draft (never trash/delete).
 */
import "server-only";

import {
  assertSafeWordPressUrl,
  buildWpRestBase,
} from "../../wordpress/normalize-url";
import type { WordPressRestCredentials } from "../../wordpress/rest-client";
import { AppError, ErrorCode } from "@/lib/errors";
import { safeLogError } from "@/lib/logging";

const TIMEOUT_MS = 15_000;

export type WordPressRollbackTargetStatus = "draft" | "private";

export type WordPressRollbackResult = {
  postId: string;
  status: string;
  editUrl: string;
  link: string | null;
  /** True when WP returned draft or private (non-public). */
  rolledBack: boolean;
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
    return "У пользователя нет прав на изменение записей в WordPress.";
  }
  if (status === 404) {
    return "Запись WordPress не найдена.";
  }
  return `WordPress вернул ошибку (HTTP ${status}).`;
}

/**
 * Move an existing WordPress post to draft or private. Never deletes/trashes.
 */
export async function rollbackWordPressRestPost(
  credentials: WordPressRestCredentials,
  input: {
    postId: string;
    targetStatus?: WordPressRollbackTargetStatus;
  }
): Promise<WordPressRollbackResult> {
  const { normalized } = await assertSafeWordPressUrl(credentials.siteUrl);
  const base = buildWpRestBase(normalized);
  const targetStatus = input.targetStatus ?? "draft";
  const postId = encodeURIComponent(input.postId);

  let response: Response;
  try {
    response = await fetch(`${base}/posts/${postId}`, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(
          credentials.username,
          credentials.applicationPassword
        ),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // WP REST accepts POST for update; PATCH also works — POST is widely compatible.
      body: JSON.stringify({ status: targetStatus }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
    });
  } catch (error) {
    safeLogError("wordpress.rest.rollback", error, {});
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось откатить запись в WordPress."
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
  const id = String(body.id);
  const editUrl = `${normalized}/wp-admin/post.php?post=${id}&action=edit`;
  const rolledBack = status === "draft" || status === "private";

  return {
    postId: id,
    status,
    editUrl,
    link: typeof body.link === "string" ? body.link : null,
    rolledBack,
  };
}
