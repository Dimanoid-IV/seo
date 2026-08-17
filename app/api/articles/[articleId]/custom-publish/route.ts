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
import { beginCustomWebhookPublication } from "@/lib/publishing/prepare-publishing-handoff";
import { IntegrationExecutionMode } from "@prisma/client";
import {
  getCustomPublishingConfig,
  getCustomPublishingWebhookUrl,
} from "@/lib/publishing/custom-webhook-config";
import {
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { evaluateCurrentArticlePublishQuality } from "@/lib/articles/publish-quality";

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
        qualityScore: true,
        title: true,
        metaTitle: true,
        metaDescription: true,
        contentHtml: true,
        targetKeyword: true,
        language: true,
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

    const currentQuality = evaluateCurrentArticlePublishQuality(article);
    if (!dryRun && (article.qualityPassed !== true || !currentQuality.passed)) {
      if (!currentQuality.passed) {
        await prisma.article.update({
          where: { id: article.id },
          data: {
            qualityPassed: false,
            qualityScore: Math.min(article.qualityScore ?? 100, currentQuality.overall),
            qualityIssuesJson: {
              score: currentQuality.overall,
              passed: false,
              items: currentQuality.criticalFlags.map((code) => ({
                code,
                message: `Publication-time quality check failed: ${code}.`,
                status: "open",
                displayLabel: code,
              })),
              repairAttempts: 0,
              validatedAt: new Date().toISOString(),
            },
          },
        });
      }
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Текущая версия статьи не прошла обязательную проверку перед публикацией. Исправьте или перегенерируйте материал."
      );
    }

    const result = dryRun
      ? await deliverCustomWebhook({
          articleId: article.id,
          websiteId: article.websiteId,
          organizationId: article.organizationId,
          endpointUrl: url,
          dryRun: true,
          persistOnSuccess: false,
        })
      : {
          dryRun: false,
          delivered: await beginCustomWebhookPublication({
            articleId: article.id,
            websiteId: article.websiteId,
            organizationId: article.organizationId,
            userId: currentUser.id,
            integrationId:
              (await getCustomPublishingConfig(article.websiteId))!.integrationId,
            mode: IntegrationExecutionMode.REVIEW_ONLY,
          }),
          statusCode: 202,
          error: null,
        };

    if (!dryRun && !result.delivered) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Webhook did not accept the article for publication."
      );
    }

    if (!dryRun) {
      // Delivery acceptance is not publication. The durable verification job
      // moves the article to PUBLISHED only after the public URL is live.
      await prisma.article.updateMany({
        where: {
          id: article.id,
          status: { not: "PUBLISHING" },
        },
        data: { status: "PUBLISHING", publishedAt: null },
      });
    }

    const config = await getCustomPublishingConfig(article.websiteId);
    return authJsonResponse({
      data: {
        ...result,
        publicationStatus: dryRun ? "TESTED" : "PUBLISHING",
        config,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
