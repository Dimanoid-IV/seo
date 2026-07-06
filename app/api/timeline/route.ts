import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getLocaleFromRequest } from "@/lib/i18n/saas/server-locale";
import { getTimelineForUser } from "@/lib/timeline/get-timeline";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

function parseLimit(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get("limit"));
    const cursor = url.searchParams.get("cursor");
    const type = url.searchParams.get("type");
    const source = url.searchParams.get("source");

    const locale = getLocaleFromRequest(request);

    const timeline = await getTimelineForUser(currentUser, {
      limit,
      cursor,
      locale,
      ...(type ? { type: type as never } : {}),
      ...(source ? { source: source as never } : {}),
    });

    return authJsonResponse({ data: timeline });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
