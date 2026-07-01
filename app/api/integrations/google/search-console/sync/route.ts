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
import {
  resolveWebsiteIdForGscSync,
  syncGscPerformanceForWebsite,
} from "@/lib/integrations/gsc-sync";

const syncBodySchema = z.object({
  websiteId: z.string().uuid().optional(),
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

    let websiteId: string | undefined;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await parseJsonBody(request);
      const parsed = syncBodySchema.safeParse(body);

      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }

      websiteId = parsed.data.websiteId;
    }

    const resolvedWebsiteId = await resolveWebsiteIdForGscSync(
      currentUser.id,
      currentUser.organizationId,
      websiteId
    );

    const result = await syncGscPerformanceForWebsite({
      websiteId: resolvedWebsiteId,
      userId: currentUser.id,
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
