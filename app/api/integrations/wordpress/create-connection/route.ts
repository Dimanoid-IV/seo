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
import { WordPressConnectionStatus } from "@prisma/client";
import {
  createWordPressConnection,
  getWordPressConnection,
  resolveWebsiteForWordPress,
} from "@/lib/integrations/wordpress-connector";

const createConnectionSchema = z.object({
  websiteId: z.string().uuid().optional(),
  siteUrl: z.string().url().optional(),
});

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = createConnectionSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const { website, organizationId, siteUrl } = await resolveWebsiteForWordPress(
      currentUser.id,
      currentUser.organizationId,
      parsed.data.websiteId,
      parsed.data.siteUrl
    );

    const existing = await getWordPressConnection({ websiteId: website.id });

    if (
      existing &&
      (existing.status === WordPressConnectionStatus.PENDING ||
        existing.status === WordPressConnectionStatus.CONNECTED)
    ) {
      return authJsonResponse({
        data: {
          connection: {
            id: existing.id,
            siteUrl: existing.siteUrl,
            status: existing.status,
            permissions: existing.permissions,
            createdAt: existing.createdAt.toISOString(),
          },
          message: "API key уже создан",
        },
      });
    }

    const { connection, apiKey, apiSecret } = await createWordPressConnection({
      websiteId: website.id,
      organizationId,
      siteUrl,
    });

    return authJsonResponse({
      data: {
        connection: {
          id: connection.id,
          siteUrl: connection.siteUrl,
          status: connection.status,
          permissions: connection.permissions,
          createdAt: connection.createdAt.toISOString(),
        },
        apiKey,
        apiSecret,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
