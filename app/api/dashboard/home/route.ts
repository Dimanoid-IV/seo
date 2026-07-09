import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getHomeScreenData } from "@/lib/dashboard/home";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured. Set DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const data = await getHomeScreenData(currentUser);

    return authJsonResponse({ data });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
