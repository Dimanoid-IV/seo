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
import { connectGoogleBusinessProfileLocation } from "@/lib/integrations/gbp";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "База данных не настроена.", {
      statusCode: 503,
    });
  }
}

const bodySchema = z.object({
  websiteId: z.string().uuid(),
  accountId: z.string().trim().min(3).max(160),
  locationId: z.string().trim().min(3).max(160),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw validationErrorFromZod(parsed.error);

    const result = await connectGoogleBusinessProfileLocation({
      websiteId: parsed.data.websiteId,
      userId: currentUser.id,
      accountId: parsed.data.accountId,
      locationId: parsed.data.locationId,
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
