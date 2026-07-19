import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getWebsiteExecutionHistory } from "@/lib/integrations/execution-history";

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
 * GET /api/integrations/executions?websiteId=...
 * Auth + org/website ownership required. Never returns secrets.
 * Read-only — does not trigger WordPress/webhook actions.
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
      select: { id: true, organizationId: true },
    });
    if (!website) {
      throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");
    }

    // Extra tenant guard: organization on token must match website org when present.
    if (
      currentUser.organizationId &&
      currentUser.organizationId !== website.organizationId
    ) {
      throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");
    }

    const executions = await getWebsiteExecutionHistory({
      organizationId: website.organizationId,
      websiteId: website.id,
      limit: 20,
    });

    return authJsonResponse({
      data: {
        websiteId: website.id,
        executions,
        /** Live publish is the product end state; currently gated off. */
        livePublish: {
          productEndState: "live_publish",
          enabled: false,
          killSwitchEngaged: true,
        },
        externalActionsEnabled: false,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
