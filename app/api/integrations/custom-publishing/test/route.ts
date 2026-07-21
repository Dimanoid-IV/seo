import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getPrisma } from "@/lib/db";
import { deliverCustomWebhook } from "@/lib/publishing/custom-webhook";
import { getCustomPublishingConfig } from "@/lib/publishing/custom-webhook-config";
import { shouldEnableCustomWebhookAutoSendFailClosed } from "@/lib/publishing/custom-webhook-autosend";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена.",
      { statusCode: 503 }
    );
  }
}

const bodySchema = z.object({
  websiteId: z.string().uuid(),
  endpointUrl: z.string().trim().url().max(2000),
  sharedSecret: z.string().trim().max(200).optional(),
});

/**
 * Site-level custom webhook test. Persists config only after 2xx.
 * Sends event "rankboost.test" only — never full article body.
 */
export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const prisma = getPrisma();
    const website = await prisma.website.findFirst({
      where: {
        id: parsed.data.websiteId,
        deletedAt: null,
        organization: {
          ownerUserId: currentUser.id,
          deletedAt: null,
        },
      },
      select: { id: true, organizationId: true },
    });
    if (!website) {
      throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");
    }

    // Use a placeholder article id only for packaging metadata — dry-run
    // payload does not include HTML. Prefer any recent article for the site.
    const article = await prisma.article.findFirst({
      where: { websiteId: website.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    if (!article) {
      // Synthetic dry-run without article: still probe endpoint with minimal payload
      // via deliverCustomWebhook requires article — create minimal probe inline.
      const { assertSafeUrl } = await import("@/lib/audit/ssrf");
      const { signWebhookPayload } = await import("@/lib/publishing/signature");
      const { upsertCustomPublishingConfig } = await import(
        "@/lib/publishing/custom-webhook-config"
      );

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(parsed.data.endpointUrl);
      } catch {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Некорректный URL webhook.");
      }
      if (parsedUrl.protocol !== "https:" && process.env.NODE_ENV !== "development") {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Webhook URL должен использовать HTTPS."
        );
      }
      await assertSafeUrl(parsedUrl);

      const payload = JSON.stringify({
        event: "rankboost.test",
        dryRun: true,
        website: { id: website.id },
      });
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "RankBoost-Webhook/1.0",
        "X-RankBoost-Event": "rankboost.test",
      };
      if (parsed.data.sharedSecret) {
        headers["X-RankBoost-Signature"] = signWebhookPayload(
          payload,
          parsed.data.sharedSecret
        );
      }

      let delivered = false;
      let statusCode = 0;
      let error: string | null = null;
      try {
        const response = await fetch(parsedUrl.toString(), {
          method: "POST",
          headers,
          body: payload,
          signal: AbortSignal.timeout(10_000),
          redirect: "manual",
        });
        statusCode = response.status;
        delivered = response.status >= 200 && response.status < 300;
        if (!delivered) error = `Эндпоинт вернул статус ${response.status}.`;
      } catch {
        error = "Не удалось связаться с эндпоинтом.";
      }

      if (delivered) {
        const autoSendEnabled =
          await shouldEnableCustomWebhookAutoSendFailClosed({
            userId: currentUser.id,
            organizationId: website.organizationId,
            websiteId: website.id,
          });
        await upsertCustomPublishingConfig({
          websiteId: website.id,
          organizationId: website.organizationId,
          endpointUrl: parsedUrl.toString(),
          tested: true,
          autoSendEnabled,
          sharedSecret: parsed.data.sharedSecret ?? null,
        });
      }

      const config = await getCustomPublishingConfig(website.id);
      return authJsonResponse({
        data: {
          dryRun: true,
          delivered,
          statusCode,
          error,
          config,
        },
      });
    }

    const result = await deliverCustomWebhook({
      articleId: article.id,
      websiteId: website.id,
      organizationId: website.organizationId,
      endpointUrl: parsed.data.endpointUrl,
      dryRun: true,
      sharedSecret: parsed.data.sharedSecret ?? null,
      persistOnSuccess: true,
      autoSendEnabledOnPersist:
        await shouldEnableCustomWebhookAutoSendFailClosed({
          userId: currentUser.id,
          organizationId: website.organizationId,
          websiteId: website.id,
        }),
    });

    const config = await getCustomPublishingConfig(website.id);
    return authJsonResponse({
      data: {
        ...result,
        config,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
