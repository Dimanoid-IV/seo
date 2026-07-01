import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getGrowthOpportunitiesForUser } from "@/lib/growth/get-opportunities";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const result = await getGrowthOpportunitiesForUser(currentUser);

    return authJsonResponse(result);
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
