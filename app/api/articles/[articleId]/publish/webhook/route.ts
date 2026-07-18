import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { assertSafeUrl } from "@/lib/audit/ssrf";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getArticleUniversalExport } from "@/lib/publishing/get-article-export";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

const WEBHOOK_TIMEOUT_MS = 10_000;

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

/**
 * Sends an approved article to a user-provided webhook endpoint.
 * - Requires an explicit, manual request (review-first; never called by cron).
 * - SSRF-protected via assertSafeUrl.
 * - `dryRun` sends only a small test ping so users can verify connectivity
 *   before delivering the full article.
 * - Never logs the endpoint URL or payload.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const { articleId } = await context.params;

    let body: { url?: unknown; dryRun?: unknown } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }

    const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
    const dryRun = body.dryRun !== false; // default to a safe dry-run

    if (!rawUrl) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Укажите URL webhook.");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Некорректный URL webhook.");
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "URL должен использовать http или https.");
    }
    await assertSafeUrl(parsedUrl);

    const result = await getArticleUniversalExport({ articleId, currentUser });
    const pkg = result.export;

    const payload = dryRun
      ? {
          event: "rankboost.webhook.test",
          dryRun: true,
          article: { id: result.articleId, slug: pkg.slug, metaTitle: pkg.metaTitle },
        }
      : {
          event: "rankboost.article.publish",
          dryRun: false,
          article: {
            id: result.articleId,
            slug: pkg.slug,
            metaTitle: pkg.metaTitle,
            metaDescription: pkg.metaDescription,
            canonicalUrl: pkg.canonicalUrl,
            html: pkg.html,
            bodyHtml: pkg.bodyHtml,
            markdown: pkg.markdown,
          },
        };

    let statusCode = 0;
    let delivered = false;
    let deliveryError: string | null = null;
    try {
      const response = await fetch(parsedUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "RankBoost-Webhook/1.0",
          "X-RankBoost-Event": payload.event,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        redirect: "manual",
      });
      statusCode = response.status;
      delivered = response.status >= 200 && response.status < 300;
      if (!delivered) {
        deliveryError = `Эндпоинт вернул статус ${response.status}.`;
      }
    } catch {
      // Do not surface internal error details (avoids leaking endpoint info).
      deliveryError = "Не удалось связаться с эндпоинтом. Проверьте URL и доступность.";
    }

    return authJsonResponse({
      data: { dryRun, delivered, statusCode, error: deliveryError },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
