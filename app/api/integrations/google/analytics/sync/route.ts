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
import { syncGa4ForWebsite } from "@/lib/integrations/ga4";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "База данных не настроена.", {
      statusCode: 503,
    });
  }
}

const bodySchema = z.object({
  websiteId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw validationErrorFromZod(parsed.error);

    const metrics = await syncGa4ForWebsite({
      websiteId: parsed.data.websiteId,
      userId: currentUser.id,
    });

    return authJsonResponse({ data: metrics });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
