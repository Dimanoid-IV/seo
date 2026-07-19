import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { trackEventFireAndForget } from "@/lib/analytics/track";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { deliverCustomWebhook } from "@/lib/publishing/custom-webhook";
import { getPrisma } from "@/lib/db";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

/**
 * Sends an approved article to a user-provided webhook endpoint.
 * - Requires an explicit, manual request (review-first; never called by cron).
 * - SSRF-protected; HTTPS preferred.
 * - `dryRun` sends event "rankboost.test" only.
 * - Never logs the endpoint URL or payload.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const { articleId } = await context.params;

    let body: { url?: unknown; dryRun?: unknown; sharedSecret?: unknown } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }

    const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
    const dryRun = body.dryRun !== false;
    const sharedSecret =
      typeof body.sharedSecret === "string" ? body.sharedSecret.trim() : null;

    if (!rawUrl) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Укажите URL webhook.");
    }

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
      select: { id: true, websiteId: true, organizationId: true },
    });
    if (!article) {
      throw new AppError(ErrorCode.NOT_FOUND, "Статья не найдена");
    }

    const result = await deliverCustomWebhook({
      articleId: article.id,
      websiteId: article.websiteId,
      organizationId: article.organizationId,
      endpointUrl: rawUrl,
      dryRun,
      sharedSecret,
      persistOnSuccess: dryRun,
    });

    if (dryRun && result.delivered) {
      trackEventFireAndForget({
        event: "webhook_tested",
        userId: currentUser.id,
        organizationId: article.organizationId,
        websiteId: article.websiteId,
        properties: {
          articleId,
          integration: "custom_webhook",
          status: "ok",
        },
      });
    }

    return authJsonResponse({
      data: {
        dryRun: result.dryRun,
        delivered: result.delivered,
        statusCode: result.statusCode,
        error: result.error,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
