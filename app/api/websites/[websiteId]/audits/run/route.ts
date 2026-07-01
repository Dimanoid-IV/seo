import { AuditTriggeredBy } from "@prisma/client";

import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { runAndPersistWebsiteAudit } from "@/lib/audit/persist-audit";
import { assertUsageLimit, recordUsage } from "@/lib/billing/feature-gates";
import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

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
  params: Promise<{ websiteId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const { websiteId } = await context.params;
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
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!website) {
      throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден или недоступен");
    }

    await assertUsageLimit({
      userId: currentUser.id,
      organizationId: website.organizationId,
      websiteId: website.id,
      key: "AUDIT_RUN",
      message:
        "You've reached the monthly audit limit for your current plan. Upgrade to continue.",
    });

    const result = await runAndPersistWebsiteAudit({
      websiteId: website.id,
      userId: currentUser.id,
      trigger: AuditTriggeredBy.USER,
    });

    await recordUsage({
      userId: currentUser.id,
      organizationId: website.organizationId,
      websiteId: website.id,
      key: "AUDIT_RUN",
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
