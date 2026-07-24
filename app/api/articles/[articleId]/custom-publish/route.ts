import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getPrisma } from "@/lib/db";
import {
  assertWebhookReadyForExplicitSend,
  deliverCustomWebhook,
} from "@/lib/publishing/custom-webhook";
import { markArticlePublishedInMonthlyPlans } from "@/lib/autopilot/link-article-publication";
import {
  getCustomPublishingConfig,
  getCustomPublishingWebhookUrl,
} from "@/lib/publishing/custom-webhook-config";
import {
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена.",
      { statusCode: 503 }
    );
  }
}

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

const bodySchema = z.object({
  dryRun: z.boolean().optional(),
});

/**
 * Explicit custom webhook send for a single article.
 * Real send requires tested config + quality pass + dryRun=false.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { articleId } = await context.params;

    let body: unknown = {};
    try {
      body = await parseJsonBody(request);
    } catch {
      body = {};
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const dryRun = parsed.data.dryRun !== false; // default safe dry-run

    const prisma = getPrisma();
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        deletedAt: null,
        organization: {
          ownerUserId: currentUser.id,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        websiteId: true,
        organizationId: true,
        qualityPassed: true,
      },
    });
    if (!article) {
      throw new AppError(ErrorCode.NOT_FOUND, "Статья не найдена");
    }

    await assertWebhookReadyForExplicitSend(article.websiteId);
    const url = await getCustomPublishingWebhookUrl(article.websiteId);
    if (!url) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Webhook URL не настроен.");
    }

    if (!dryRun && article.qualityPassed !== true) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Отправка доступна только после успешной проверки качества."
      );
    }

    const result = await deliverCustomWebhook({
      articleId: article.id,
      websiteId: article.websiteId,
      organizationId: article.organizationId,
      endpointUrl: url,
      dryRun,
      persistOnSuccess: false,
    });

    if (!dryRun && result.delivered) {
      const publishedAt = new Date();
      await prisma.article.update({
        where: { id: article.id },
        data: {
          status: "PUBLISHED",
          publishedAt,
          wordpressPublishedUrl: result.externalUrl ?? undefined,
        },
      });
      await markArticlePublishedInMonthlyPlans({
        articleId: article.id,
        websiteId: article.websiteId,
        publishedAt,
        publishingPath: "webhook",
      });
    }

    const config = await getCustomPublishingConfig(article.websiteId);
    return authJsonResponse({ data: { ...result, config } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
