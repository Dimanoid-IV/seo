import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getPrisma } from "@/lib/db";
import { getCustomPublishingConfig } from "@/lib/publishing/custom-webhook-config";
import { buildCustomPublishingDisplayState } from "@/lib/publishing/custom-publishing-display";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена.",
      { statusCode: 503 }
    );
  }
}

/**
 * Returns host-only custom publishing status for the website.
 * Never returns endpoint URL or shared secret.
 */
export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const url = new URL(request.url);
    const websiteId = url.searchParams.get("websiteId");
    if (!websiteId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Укажите websiteId.");
    }

    const prisma = getPrisma();
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
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

    const config = await getCustomPublishingConfig(website.id);
    const display = buildCustomPublishingDisplayState({
      endpointConfigured: config?.endpointConfigured,
      endpointHost: config?.endpointHost,
      testedAt: config?.testedAt,
      hasSharedSecret: config?.hasSharedSecret,
    });

    return authJsonResponse({
      data: {
        config: config
          ? {
              endpointConfigured: config.endpointConfigured,
              endpointHost: config.endpointHost,
              testedAt: config.testedAt,
              hasSharedSecret: config.hasSharedSecret,
              autoSendEnabled: config.autoSendEnabled,
            }
          : null,
        display,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
