import { requireAdmin } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getAdminGrowthDashboard } from "@/lib/admin/growth-dashboard";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Database is not configured.", {
      statusCode: 503,
    });
  }
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    await requireAdmin(request);

    const url = new URL(request.url);
    const days = Number.parseInt(url.searchParams.get("days") || "30", 10);
    const data = await getAdminGrowthDashboard(days);

    return authJsonResponse({ data });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
