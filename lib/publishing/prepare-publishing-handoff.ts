/**
 * Safe publishing handoff after a quality-passed article draft.
 * Never live-publishes. WordPress → draft only. Webhook → ready (send only when allowed).
 */
import "server-only";

import { AutopilotMode } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { createWordPressDraftForArticle } from "@/lib/integrations/wordpress-drafts";
import {
  getCustomPublishingConfig,
  getCustomPublishingWebhookUrl,
  isWebhookReadyForAutoSend,
} from "@/lib/publishing/custom-webhook-config";
import { buildUniversalExport } from "@/lib/publishing/universal-export";
import type { AutopilotPlanItem } from "@/lib/autopilot/plan-item-types";
import { assertSafeUrl } from "@/lib/audit/ssrf";

export type PublishingHandoffResult = {
  path: AutopilotPlanItem["publishingPath"];
  pipelineState: NonNullable<AutopilotPlanItem["pipelineState"]>;
  wordpressPostId?: string;
  patch: Partial<AutopilotPlanItem>;
  summaryKey: string;
  /** True only when a real webhook delivery was attempted (never in default modes). */
  webhookDelivered?: boolean;
};

const WEBHOOK_TIMEOUT_MS = 10_000;

/**
 * Prepare the safest available publishing path for a quality-passed article.
 * - WordPress connected → create WP draft (not live publish)
 * - Webhook tested → mark WEBHOOK_READY; send only if autoSendEnabled + AUTOPUBLISH
 * - Else → mark UNIVERSAL_PACKAGE_READY (package is built on demand via export API)
 */
export async function preparePublishingHandoff(input: {
  articleId: string;
  userId: string;
  websiteId: string;
  organizationId: string;
  autopilotMode: AutopilotMode;
  wordpressConnected: boolean;
  currentItem: AutopilotPlanItem;
  /** When true, never mutate / never call external webhook send. */
  dryRun?: boolean;
}): Promise<PublishingHandoffResult> {
  const nowIso = new Date().toISOString();
  const custom = await getCustomPublishingConfig(input.websiteId);

  if (input.wordpressConnected) {
    if (
      input.currentItem.wordpressDraftCreatedAt ||
      input.currentItem.pipelineState === "WORDPRESS_DRAFT_CREATED"
    ) {
      return {
        path: "wordpress_draft",
        pipelineState: "WORDPRESS_DRAFT_CREATED",
        patch: {
          pipelineState: "WORDPRESS_DRAFT_CREATED",
          publishingPath: "wordpress_draft",
          nextAutomatedStep: "review_wordpress_draft",
          status: "executed",
        },
        summaryKey: "wordpressDraftAlreadyCreated",
      };
    }

    if (input.dryRun) {
      return {
        path: "wordpress_draft",
        pipelineState: "WORDPRESS_DRAFT_CREATED",
        patch: {},
        summaryKey: "wouldCreateWordPressDraft",
      };
    }

    const result = await createWordPressDraftForArticle({
      articleId: input.articleId,
      userId: input.userId,
    });

    return {
      path: "wordpress_draft",
      pipelineState: "WORDPRESS_DRAFT_CREATED",
      wordpressPostId: result.postId,
      patch: {
        pipelineState: "WORDPRESS_DRAFT_CREATED",
        publishingPath: "wordpress_draft",
        wordpressDraftCreatedAt: nowIso,
        nextAutomatedStep: "review_wordpress_draft",
        status: "executed",
        reviewQueueHref: "/app/review",
      },
      summaryKey: "wordpressDraftCreated",
    };
  }

  if (custom?.endpointConfigured && custom.testedAt) {
    // AUTOPUBLISH is gated off product-wide; keep send path for future but default to ready-only.
    const mayAutoSend =
      input.autopilotMode === AutopilotMode.AUTOPUBLISH &&
      isWebhookReadyForAutoSend(custom);

    if (input.dryRun) {
      return {
        path: "webhook",
        pipelineState: mayAutoSend ? "WEBHOOK_SENT" : "WEBHOOK_READY",
        patch: {},
        summaryKey: mayAutoSend ? "wouldSendWebhook" : "wouldPrepareWebhookReady",
      };
    }

    if (mayAutoSend) {
      const delivered = await sendWebhookPackage({
        articleId: input.articleId,
        websiteId: input.websiteId,
      });
      return {
        path: "webhook",
        pipelineState: delivered ? "WEBHOOK_SENT" : "WEBHOOK_READY",
        webhookDelivered: delivered,
        patch: {
          pipelineState: delivered ? "WEBHOOK_SENT" : "WEBHOOK_READY",
          publishingPath: "webhook",
          webhookReadyAt: nowIso,
          webhookSentAt: delivered ? nowIso : undefined,
          nextAutomatedStep: delivered ? "done" : "send_webhook_when_allowed",
          status: delivered ? "executed" : "prepared",
          reviewQueueHref: "/app/review",
        },
        summaryKey: delivered ? "webhookSent" : "webhookReady",
      };
    }

    return {
      path: "webhook",
      pipelineState: "WEBHOOK_READY",
      patch: {
        pipelineState: "WEBHOOK_READY",
        publishingPath: "webhook",
        webhookReadyAt: nowIso,
        nextAutomatedStep: "send_webhook_when_allowed",
        status: "prepared",
        reviewQueueHref: "/app/review",
      },
      summaryKey: "webhookReady",
    };
  }

  if (input.dryRun) {
    return {
      path: "universal_package",
      pipelineState: "UNIVERSAL_PACKAGE_READY",
      patch: {},
      summaryKey: "wouldPrepareUniversalPackage",
    };
  }

  // Verify article content exists so the export panel will work.
  await assertArticleHasContent(input.articleId, input.websiteId);

  return {
    path: "universal_package",
    pipelineState: "UNIVERSAL_PACKAGE_READY",
    patch: {
      pipelineState: "UNIVERSAL_PACKAGE_READY",
      publishingPath: "universal_package",
      universalPackagePreparedAt: nowIso,
      nextAutomatedStep: "copy_or_send_package",
      status: "prepared",
      reviewQueueHref: "/app/review",
    },
    summaryKey: "universalPackageReady",
  };
}

async function assertArticleHasContent(
  articleId: string,
  websiteId: string
): Promise<void> {
  const prisma = getPrisma();
  const article = await prisma.article.findFirst({
    where: { id: articleId, websiteId, deletedAt: null },
    select: { id: true, contentHtml: true, title: true },
  });
  if (!article?.contentHtml?.trim()) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Article has no content for publishing package."
    );
  }
}

async function sendWebhookPackage(input: {
  articleId: string;
  websiteId: string;
}): Promise<boolean> {
  const url = await getCustomPublishingWebhookUrl(input.websiteId);
  if (!url) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  await assertSafeUrl(parsed);

  const prisma = getPrisma();
  const [article, website] = await Promise.all([
    prisma.article.findFirst({
      where: { id: input.articleId, websiteId: input.websiteId, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        contentHtml: true,
        targetKeyword: true,
        language: true,
      },
    }),
    prisma.website.findUnique({
      where: { id: input.websiteId },
      select: { url: true },
    }),
  ]);

  if (!article) return false;

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
    { websiteUrl: website?.url ?? "" }
  );

  try {
    const response = await fetch(parsed.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RankBoost-Webhook/1.0",
        "X-RankBoost-Event": "rankboost.article.publish",
      },
      body: JSON.stringify({
        event: "rankboost.article.publish",
        dryRun: false,
        article: {
          id: article.id,
          slug: pkg.slug,
          metaTitle: pkg.metaTitle,
          metaDescription: pkg.metaDescription,
          canonicalUrl: pkg.canonicalUrl,
          html: pkg.html,
          bodyHtml: pkg.bodyHtml,
          markdown: pkg.markdown,
        },
      }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      redirect: "manual",
    });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}
