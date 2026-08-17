import "server-only";

import { load } from "cheerio";

import { AppError, ErrorCode } from "@/lib/errors";
import { safeLogError } from "@/lib/logging";
import type { WordPressRestCredentials } from "@/lib/integrations/wordpress/rest-client";
import { assertSafeWordPressUrl, buildWpRestBase } from "@/lib/integrations/wordpress/normalize-url";

import { findWordPressContentByUrl } from "./update-metadata";

const TIMEOUT_MS = 15_000;

export type WordPressInternalLinkInput = {
  sourceUrl: string;
  targetUrl: string;
  anchor: string;
};

export type WordPressInternalLinkResult = {
  applied: boolean;
  verified: boolean;
  alreadyApplied: boolean;
  postId: string;
  publicUrl: string;
  editUrl: string;
};

function basicAuthHeader(credentials: WordPressRestCredentials): string {
  const password = credentials.applicationPassword.replace(/\s+/g, "");
  return `Basic ${Buffer.from(`${credentials.username}:${password}`, "utf8").toString("base64")}`;
}

function assertSameSite(siteUrl: string, ...urls: string[]): void {
  const site = new URL(siteUrl);
  for (const value of urls) {
    const target = new URL(value);
    if (target.hostname.toLowerCase() !== site.hostname.toLowerCase()) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Internal-link URL does not belong to the connected WordPress site."
      );
    }
  }
}

function normalizedComparableUrl(value: string, base: string): string {
  const parsed = new URL(value, base);
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Insert one contextual link into visible prose; never edits an existing link/code block. */
export function insertContextualInternalLink(input: {
  html: string;
  sourceUrl: string;
  targetUrl: string;
  anchor: string;
}): { html: string; changed: boolean; alreadyApplied: boolean } {
  const $ = load(`<div data-rankboost-root>${input.html}</div>`, undefined, false);
  const root = $("[data-rankboost-root]");
  const expected = normalizedComparableUrl(input.targetUrl, input.sourceUrl);
  const existing = root.find("a[href]").toArray().some((element) => {
    const href = $(element).attr("href");
    if (!href) return false;
    try {
      return normalizedComparableUrl(href, input.sourceUrl) === expected;
    } catch {
      return false;
    }
  });
  if (existing) {
    return { html: root.html() ?? input.html, changed: false, alreadyApplied: true };
  }

  const anchor = input.anchor.trim();
  if (!anchor) return { html: input.html, changed: false, alreadyApplied: false };
  const needle = anchor.toLocaleLowerCase();
  let changed = false;

  root.find("*").contents().each((_, node) => {
    if (changed || node.type !== "text") return;
    const parent = $(node).parent();
    if (parent.closest("a,script,style,code,pre,noscript").length) return;
    const text = node.data ?? "";
    const index = text.toLocaleLowerCase().indexOf(needle);
    if (index < 0) return;
    const before = text.slice(0, index);
    const match = text.slice(index, index + anchor.length);
    const after = text.slice(index + anchor.length);
    $(node).replaceWith(
      `${escapeText(before)}<a href="${expected}">${escapeText(match)}</a>${escapeText(after)}`
    );
    changed = true;
  });

  return { html: root.html() ?? input.html, changed, alreadyApplied: false };
}

async function wpJson<T>(
  url: string,
  credentials: WordPressRestCredentials,
  init: RequestInit = {}
): Promise<{ response: Response; body: T | null }> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: basicAuthHeader(credentials),
      Accept: "application/json",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let body: T | null = null;
  try {
    body = (await response.json()) as T;
  } catch {
    body = null;
  }
  return { response, body };
}

export async function addWordPressInternalLink(
  credentials: WordPressRestCredentials,
  input: WordPressInternalLinkInput
): Promise<WordPressInternalLinkResult> {
  const { normalized } = await assertSafeWordPressUrl(credentials.siteUrl);
  assertSameSite(normalized, input.sourceUrl, input.targetUrl);
  const target = await findWordPressContentByUrl(credentials, input.sourceUrl);
  const base = buildWpRestBase(normalized);
  const endpoint = `${base}/${target.objectType}/${target.postId}`;
  const current = await wpJson<{
    id?: number;
    link?: string;
    content?: { raw?: string };
  }>(`${endpoint}?context=edit`, credentials);
  if (!current.response.ok || !current.body?.content?.raw) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "WordPress content could not be loaded for a safe link update.");
  }

  const updated = insertContextualInternalLink({
    html: current.body.content.raw,
    sourceUrl: input.sourceUrl,
    targetUrl: input.targetUrl,
    anchor: input.anchor,
  });
  if (!updated.changed && !updated.alreadyApplied) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "The approved anchor was not found in visible WordPress body copy."
    );
  }

  if (updated.changed) {
    const saved = await wpJson<{ id?: number; link?: string }>(endpoint, credentials, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: updated.html }),
    });
    if (!saved.response.ok || typeof saved.body?.id !== "number") {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `WordPress rejected the internal-link update (HTTP ${saved.response.status}).`);
    }
  }

  const publicUrl = target.link ?? input.sourceUrl;
  let verified = false;
  try {
    const response = await fetch(publicUrl, {
      headers: { Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) {
      const html = await response.text();
      const $ = load(html);
      const expected = normalizedComparableUrl(input.targetUrl, input.sourceUrl);
      verified = $("a[href]").toArray().some((element) => {
        const href = $(element).attr("href");
        if (!href) return false;
        try {
          return normalizedComparableUrl(href, publicUrl) === expected;
        } catch {
          return false;
        }
      });
    }
  } catch (error) {
    safeLogError("wordpress.rest.verify_internal_link", error, { sourceUrl: input.sourceUrl });
  }

  return {
    applied: updated.changed || updated.alreadyApplied,
    verified,
    alreadyApplied: updated.alreadyApplied,
    postId: target.postId,
    publicUrl,
    editUrl: `${normalized}/wp-admin/post.php?post=${target.postId}&action=edit`,
  };
}
