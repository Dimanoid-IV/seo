import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { refreshBrandVoiceForUser } from "@/lib/brand-voice/service";

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
    const body = (await request.json().catch(() => ({}))) as {
      websiteId?: string;
    };

    const profile = await refreshBrandVoiceForUser(
      currentUser,
      body.websiteId
    );
    return authJsonResponse({ data: { profile } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
