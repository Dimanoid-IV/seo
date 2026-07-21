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
import {
  disconnectCustomPublishingConfig,
  getCustomPublishingConfig,
  upsertCustomPublishingConfig,
} from "@/lib/publishing/custom-webhook-config";
import { assertSafeUrl } from "@/lib/audit/ssrf";
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

const saveSchema = z.object({
  websiteId: z.string().uuid(),
  endpointUrl: z.string().trim().url().max(2000),
  sharedSecret: z.string().trim().max(200).optional(),
  /** Require prior successful test — enforced by requiring testedAt or forceTested */
  markTested: z.boolean().optional(),
});

const disconnectSchema = z.object({
  websiteId: z.string().uuid(),
});

/**
 * Save custom webhook config. Prefer saving after successful test
 * (testedAt set). Does not send article content.
 */
export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = saveSchema.safeParse(body);
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

    const existing = await getCustomPublishingConfig(website.id);
    const tested =
      parsed.data.markTested === true || Boolean(existing?.testedAt);

    if (!tested) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Сначала проверьте соединение (тест webhook)."
      );
    }

    const autoSendEnabled = await shouldEnableCustomWebhookAutoSendFailClosed({
      userId: currentUser.id,
      organizationId: website.organizationId,
      websiteId: website.id,
    });

    const config = await upsertCustomPublishingConfig({
      websiteId: website.id,
      organizationId: website.organizationId,
      endpointUrl: parsedUrl.toString(),
      tested: true,
      autoSendEnabled,
      sharedSecret: parsed.data.sharedSecret ?? undefined,
    });

    return authJsonResponse({ data: { saved: true, config } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = disconnectSchema.safeParse(body);
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
      select: { id: true },
    });
    if (!website) {
      throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");
    }

    await disconnectCustomPublishingConfig(website.id);
    return authJsonResponse({ data: { disconnected: true } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
