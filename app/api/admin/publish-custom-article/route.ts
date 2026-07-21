import { ArticleStatus } from "@prisma/client";

import { authJsonResponse } from "@/lib/auth/responses";
import { getPrisma } from "@/lib/db";
import {
  assertWebhookReadyForExplicitSend,
  deliverCustomWebhook,
} from "@/lib/publishing/custom-webhook";
import { getCustomPublishingWebhookUrl } from "@/lib/publishing/custom-webhook-config";

export const runtime = "nodejs";

function normalizeDomain(value: string): string {
  const raw = value.trim().toLowerCase();
  if (!raw) return "";
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname
      .replace(/^www\./, "")
      .replace(/\.$/, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

/**
 * One-shot production ops helper for publishing exactly one article through
 * an already connected custom endpoint. Inert unless
 * CUSTOM_PUBLISHING_SETUP_TOKEN is present in the deployment environment.
 */
export async function POST(request: Request) {
  const token = process.env.CUSTOM_PUBLISHING_SETUP_TOKEN?.trim();
  if (!token) {
    return authJsonResponse({ error: "setup_not_configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return authJsonResponse({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    articleId?: unknown;
    domain?: unknown;
  };
  const articleId =
    typeof body.articleId === "string" && body.articleId.trim()
      ? body.articleId.trim()
      : process.env.CUSTOM_PUBLISHING_ARTICLE_ID?.trim();
  const domain = normalizeDomain(
    typeof body.domain === "string" && body.domain.trim()
      ? body.domain.trim()
      : process.env.CUSTOM_PUBLISHING_SETUP_DOMAIN?.trim() || "popart.ee"
  );

  if (!articleId) {
    return authJsonResponse({ error: "missing_article_id" }, { status: 400 });
  }

  const prisma = getPrisma();
  const article = await prisma.article.findFirst({
    where: { id: articleId, deletedAt: null },
    select: {
      id: true,
      title: true,
      websiteId: true,
      organizationId: true,
      status: true,
      qualityPassed: true,
      wordpressPublishedUrl: true,
      website: { select: { url: true } },
    },
  });

  if (!article) {
    return authJsonResponse({ error: "article_not_found" }, { status: 404 });
  }
  if (normalizeDomain(article.website.url) !== domain) {
    return authJsonResponse({ error: "domain_mismatch", domain }, { status: 403 });
  }
  if (article.qualityPassed !== true) {
    return authJsonResponse({ error: "quality_not_passed" }, { status: 400 });
  }
  if (article.status === ArticleStatus.PUBLISHED && article.wordpressPublishedUrl) {
    return authJsonResponse({
      data: {
        alreadyPublished: true,
        articleId: article.id,
        title: article.title,
        url: article.wordpressPublishedUrl,
      },
    });
  }

  await assertWebhookReadyForExplicitSend(article.websiteId);
  const url = await getCustomPublishingWebhookUrl(article.websiteId);
  if (!url) {
    return authJsonResponse({ error: "webhook_url_missing" }, { status: 400 });
  }

  const result = await deliverCustomWebhook({
    articleId: article.id,
    websiteId: article.websiteId,
    organizationId: article.organizationId,
    endpointUrl: url,
    dryRun: false,
    persistOnSuccess: false,
  });

  if (!result.delivered) {
    return authJsonResponse(
      {
        error: "delivery_failed",
        statusCode: result.statusCode,
        message: result.error,
      },
      { status: 502 }
    );
  }

  await prisma.article.update({
    where: { id: article.id },
    data: {
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      wordpressPublishedUrl: result.externalUrl ?? article.wordpressPublishedUrl,
    },
  });

  return authJsonResponse({
    data: {
      published: true,
      articleId: article.id,
      title: article.title,
      statusCode: result.statusCode,
      externalId: result.externalId ?? null,
      url: result.externalUrl ?? null,
      duplicate: result.duplicate === true,
    },
  });
}
