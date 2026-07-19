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
import { testAndOptionallySaveApplicationPassword } from "@/lib/integrations/wordpress/connect-application-password";
import { getPrisma } from "@/lib/db";

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
  siteUrl: z.string().trim().min(3).max(500),
  username: z.string().trim().min(1).max(120),
  applicationPassword: z.string().trim().min(8).max(200),
});

/**
 * Test-only WordPress Application Password check (does not persist).
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

    const result = await testAndOptionallySaveApplicationPassword({
      websiteId: website.id,
      organizationId: website.organizationId,
      siteUrl: parsed.data.siteUrl,
      username: parsed.data.username,
      applicationPassword: parsed.data.applicationPassword,
      save: false,
    });

    return authJsonResponse({
      data: {
        ok: true,
        siteUrl: result.siteUrl,
        httpsWarning: result.httpsWarning,
        userLogin: result.userLogin,
        draftOnly: true,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
